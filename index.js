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

async function addDepartment() {
  const { name } = await inquirer.prompt({
    name: "name",
    type: "input",
    message: "Department name:",
  });

  await query(`INSERT INTO departments SET ?`, { name });
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
}

async function addEmployee() {
  const roles = await getAllEntries("roles");
  const employees = await getAllEntries("employees");
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
      choices: roles.map((role) => role.title),
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
}

async function parseChoice(choice) {
  switch (choice) {
    case "View all departments":
      console.table(await getAllEntries("departments"));
      mainMenu();
      break;
    case "View all roles":
      console.table(await getAllEntries("roles"));
      mainMenu();
      break;
    case "View all employees":
      console.table(await getAllEntries("employees"));
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
    default:
      console.log("Bye Bye!");
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
      "Quit",
    ],
  });
  parseChoice(choice);
  return;
}
