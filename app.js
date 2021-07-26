const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndDueDateProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.dueDate !== undefined
  );
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasStatusAndDueDateProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.dueDate !== undefined
  );
};
const hasStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasDueDateAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.dueDate !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  try {
    let data = null;
    let getTodosQuery;
    let {
      search_q = "",
      status = "",
      priority = "",
      category = "",
      dueDate = "",
    } = request.query;

    switch (true) {
      case hasCategoryProperty(request.query):
        getTodosQuery = `
          SELECT * FROM todo
           WHERE todo LIKE '%${search_q}' AND
           category = '${category}';`;
        break;
      case hasStatusProperty(request.query):
        getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%' AND
          status = '${status}';`;
        break;
      case hasDueDateProperty(request.query):
        getTodosQuery = `
         SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%' AND
          due_date = '${dueDate}'; `;
        break;
      case hasPriorityProperty(request.query):
        getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%' AND
          priority = '${priority}';`;
        break;
      case hasCategoryAndDueDateProperty(request.query):
        getTodosQuery = `
           SELECT * FROM todo
           WHERE todo LIKE '%${search_q}%' AND
           category = '${category}' AND due_date = ${dueDate}';`;
        break;
      case hasCategoryAndPriorityProperty(request.query):
        getTodosQuery = `
           SELECT * FROM  todo 
            WHERE todo LIKE '%${search_q}%' AND 
            category = '${category}' AND priority = '${priority}'; `;
        break;
      case hasCategoryAndStatusProperty(request.query):
        getTodosQuery = `
            SELECT * FROM todo
             WHERE todo LIKE  '%${search_q}%' AND
             category = '${category}' AND status = '${status}';`;
        break;
      case hasStatusAndDueDateProperty(request.query):
        getTodosQuery = `
           SELECT * FROM todo
           WHERE todo LIKE  '%${search_q}%' AND
           status = '${status}' AND due_date = '${dueDate}';`;
        break;
      case hasStatusAndPriorityProperty(request.query):
        getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE  '%${search_q}%' AND
           priority = '${priority}' AND status = '${status}';`;
        break;
      case hasDueDateAndPriorityProperty(request.query):
        getTodosQuery = `
           SELECT * FROM todo
           WHERE todo LIKE  '%${search_q}%' AND
           due_date = '${dueDate}' AND priority = '${priority}';`;
        break;
      default:
        getTodosQuery = `
                   SELECT
                     *
                    FROM
                    todo 
                      WHERE
                    todo LIKE '%${search_q}%';`;
    }
    data = await database.all(getTodosQuery);
    response.send(data);
  } catch (e) {
    response.status(400);
    response.send("Invalid Todo");
    console.log(`DB Error:${e.message}`);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { dueDate } = request.params;
  const getWithDateQuery = `
    SELECT * FROM todo
    WHERE due_date = '${dueDate}';`;
  const todo = await database.all(getWithDateQuery);
  response.send(todo);
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`'${updateColumn}' Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
