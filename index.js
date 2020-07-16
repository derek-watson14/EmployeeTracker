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

  connection.query(`INSERT INTO departments SET ?`, { name }, function (err) {
    if (err) throw err;
    console.log("Added role successfully!");
    mainMenu();
  });
}

function addRole() {
  let departments = getAllEntries("departments");
  departments = departments.map((dept) => `${dept.id}. ${dept.name}`);
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
      choices: departments,
    },
  ]);
  const department_id = department.split(".")[0];

  connection.query(
    `INSERT INTO roles SET ?`,
    { title, salary, department_id },
    function (err) {
      if (err) throw err;
      console.log("Added role successfully!");
      mainMenu();
    }
  );
}

async function addEmployee() {
  let roles = await getAllEntries("roles");
  let employees = await getAllEntries("employees");

  roles = roles.map((role) => `${role.id}. ${role.title}`);
  employees = employees.map((e) => `${e.id}. ${e.first_name} ${e.first_name}`);
  employees.unshift("0. None");

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
      choices: roles,
    },
    {
      name: "manager",
      type: "list",
      message: "Choose manager:",
      choices: employees,
    },
  ]);
  const role_id = role.split(".")[0];
  const manager_id = manager === "0. None" ? null : manager.split(".")[0];

  connection.query(
    `INSERT INTO employees SET ?`,
    { first_name, last_name, role_id, manager_id },
    function (err) {
      if (err) throw err;
      console.log("Added employee successfully!");
      mainMenu();
    }
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
      addDepartment();
      break;
    case "Add role":
      addRole();
      break;
    case "Add employee":
      addEmployee();
      break;
    case "Update employee role":
      console.log("7");
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
