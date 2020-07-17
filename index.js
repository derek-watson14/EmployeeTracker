var mysql = require("mysql");
const util = require("util");
var inquirer = require("inquirer");
var cTable = require("console.table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "employee_trackerDB",
  multipleStatements: true,
});

connection.connect(function (err) {
  if (err) throw err;
  mainMenu();
});

const query = util.promisify(connection.query).bind(connection);

const validateNumber = async (input) => {
  if (isNaN(parseInt(input))) {
    return "Not a number";
  } else {
    return true;
  }
};

async function getAllEntries(table) {
  return await query(`SELECT * FROM ${table}`);
}

async function getAllRoles() {
  return await query(`
    SELECT roles.id, roles.title, roles.salary, departments.name AS department
    FROM roles INNER JOIN departments
    ON roles.department_id = departments.id;
  `);
}

async function getAllEmployees() {
  return await query(`
    SELECT employees.id, employees.first_name, employees.last_name, roles.salary, roles.title
    FROM employees INNER JOIN roles 
    ON employees.role_id = roles.id;  
  `);
}

async function addDepartment() {
  const { name } = await inquirer.prompt({
    name: "name",
    type: "input",
    message: "Department name:",
  });

  await query(`INSERT INTO departments SET ?`, { name });
  console.log("Department Added");
}

async function addRole() {
  let departments = await getAllEntries("departments");
  const { title, salary, department } = await inquirer.prompt([
    {
      name: "title",
      type: "input",
      message: "Title:",
    },
    {
      name: "salary",
      type: "input",
      message: "Salary:",
      validate: validateNumber,
    },
    {
      name: "department",
      type: "list",
      message: "Choose department:",
      choices: departments.map((dept) => dept.name),
    },
  ]);

  const department_id = departments.filter((d) => d.name === department)[0].id;

  await query(`INSERT INTO roles SET ?`, { title, salary, department_id });
  console.log("Role Added");
}

async function addEmployee() {
  const roles = await getAllEntries("roles");
  const employees = await getAllEntries("employees");

  const roleList = roles.map((role) => role.title);
  const employeeList = employees.map((e) => `${e.first_name} ${e.last_name}`);
  employeeList.unshift("None");

  const { first_name, last_name, role, manager } = await inquirer.prompt([
    {
      name: "first_name",
      type: "input",
      message: "First name:",
    },
    {
      name: "last_name",
      type: "input",
      message: "Last Name:",
    },
    {
      name: "role",
      type: "list",
      message: "Role:",
      choices: roleList,
    },
    {
      name: "manager",
      type: "list",
      message: "Choose manager:",
      choices: employeeList,
    },
  ]);
  const role_id = roles.filter((r) => r.title === role)[0].id;
  const getManagerId = () => {
    if (manager === "None") {
      return null;
    } else {
      return employees.filter((e) => {
        return e.first_name, e.last_name === manager;
      })[0].id;
    }
  };
  const manager_id = getManagerId();

  await query(`INSERT INTO employees SET ?`, {
    first_name,
    last_name,
    role_id,
    manager_id,
  });
  console.log("Employee Added");
}

async function updateEmployeeRole() {
  const roles = await getAllEntries("roles");
  const employees = await getAllEntries("employees");

  const roleList = roles.map((role) => role.title);
  const employeeList = employees.map((e) => `${e.first_name} ${e.last_name}`);

  const { employee, role } = await inquirer.prompt([
    {
      name: "employee",
      type: "list",
      message: "Choose employee:",
      choices: employeeList,
    },
    {
      name: "role",
      type: "list",
      message: "Choose new role:",
      choices: roleList,
    },
  ]);

  const role_id = roles.filter((r) => r.title === role)[0].id;
  const employee_id = employees.filter((e) => {
    return `${e.first_name} ${e.last_name}` === employee;
  })[0].id;

  await query(
    `UPDATE employees SET role_id = ${role_id} WHERE id = ${employee_id}`
  );
  console.log("Employee Updated");
}

async function removeDepartment() {
  const departments = await getAllEntries("departments");
  const departmentNames = departments.map((dept) => dept.name);

  const { department } = await inquirer.prompt({
    name: "department",
    type: "list",
    message: "Choose department to delete:",
    choices: departmentNames,
  });

  const { confirmed } = await inquirer.prompt({
    name: "confirmed",
    type: "confirm",
    message:
      "This action will also remove all department roles and employees. Proceed?",
  });

  if (!confirmed) {
    console.log("Deletion cancelled");
  } else {
    const department_id = departments.filter((d) => d.name === department)[0]
      .id;

    const deptRoles = await query(
      `SELECT id FROM roles where department_id = ${department_id}`
    );
    const roleList = "(" + deptRoles.map((i) => i.id).join(", ") + ")";

    await query(`
      DELETE FROM departments WHERE id = ${department_id};
      DELETE FROM roles WHERE department_id = ${department_id};
      DELETE FROM employees WHERE role_id IN ${roleList};
    `);
    console.log("Department removed");
  }
}

async function removeRole() {
  const roles = await getAllEntries("roles");
  const roleTitles = roles.map((role) => role.title);

  const { role } = await inquirer.prompt({
    name: "role",
    type: "list",
    message: "Choose role to delete:",
    choices: roleTitles,
  });

  const { confirmed } = await inquirer.prompt({
    name: "confirmed",
    type: "confirm",
    message:
      "This action will also remove all employees with this role. Proceed?",
  });

  if (!confirmed) {
    console.log("Deletion cancelled");
  } else {
    const role_id = roles.filter((r) => r.title === role)[0].id;

    await query(`
      DELETE FROM roles WHERE id = ${role_id};
      DELETE FROM employees WHERE role_id = ${role_id};
    `);
    console.log("Role removed");
  }
}

async function removeEmployee() {
  const employees = await getAllEntries("employees");
  const employeeNames = employees.map((e) => `${e.first_name} ${e.last_name}`);

  const { emp } = await inquirer.prompt({
    name: "emp",
    type: "list",
    message: "Choose employee to delete:",
    choices: employeeNames,
  });

  const { confirmed } = await inquirer.prompt({
    name: "confirmed",
    type: "confirm",
    message: `This action will permenantly remove ${emp} from the database. Proceed?`,
  });

  if (!confirmed) {
    console.log("Deletion cancelled");
  } else {
    const emp_id = employees.filter((e) => {
      return emp === `${e.first_name} ${e.last_name}`;
    })[0].id;

    await query(`
      DELETE FROM employees WHERE id = ${emp_id};
    `);
    console.log("Employee removed");
  }
}

async function parseChoice(choice) {
  switch (choice) {
    case "View all departments":
      console.table(await getAllEntries("departments"));
      mainMenu();
      break;
    case "View all roles":
      console.table(await getAllRoles());
      mainMenu();
      break;
    case "View all employees":
      console.table(await getAllEmployees());
      mainMenu();
      break;
    case "Add department":
      await addDepartment();
      mainMenu();
      break;
    case "Add role":
      await addRole();
      mainMenu();
      break;
    case "Add employee":
      await addEmployee();
      mainMenu();
      break;
    case "Update employee role":
      await updateEmployeeRole();
      mainMenu();
      break;
    case "Remove department":
      await removeDepartment();
      mainMenu();
      break;
    case "Remove role":
      await removeRole();
      mainMenu();
      break;
    case "Remove employee":
      await removeEmployee();
      mainMenu();
      break;
    default:
      console.log("Auf Wiedersehen!");
      connection.end();
  }
}

async function mainMenu() {
  const { choice } = await inquirer.prompt({
    name: "choice",
    type: "list",
    message: "What would you like to do?",
    choices: [
      "View all departments",
      "View all roles",
      "View all employees",
      "Add department",
      "Add role",
      "Add employee",
      "Update employee role",
      "Remove department",
      "Remove role",
      "Remove employee",
      "Quit",
    ],
  });
  parseChoice(choice);
}
