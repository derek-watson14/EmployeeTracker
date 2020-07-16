USE employee_trackerDB;

INSERT INTO departments (id, name) 
VALUES (1, "Engineering"), 
(2, "Marketing"), 
(3, "Human Resources");

INSERT INTO roles (id, title, salary, department_id) 
VALUES (1, "Project Manager", 90000, 1), 
(2, "Senior Developer", 80000, 1), 
(3, "Junior Developer", 60000, 1),
(4, "Sales Lead", 70000, 2), 
(5, "Sales Person", 55000, 2),
(6, "HR Manager", 60000, 3);

INSERT INTO employees (first_name, last_name, role_id, manager_id) 
VALUES ("Derek", "Watson", 1, null), 
("Tyler", "Smiley", 4, null), 
("Andrew", "Lawrence", 6, null),
("Robert", "Vandenhole", 5, 2),
("Brody", "Watson", 3, 1);

