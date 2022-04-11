let express = require("express");
let path = require("path");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");

let app = express();
app.use(express.json());

module.exports = app;

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Running Server Successfully..!!!");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/states/", async (request, response) => {
  let getStatesQuery = `
        SELECT state_id AS stateId, state_name AS stateName, population
        FROM state
    `;
  let states = await db.all(getStatesQuery);
  response.send(states);
});

app.get("/states/:stateId/", async (request, response) => {
  let { stateId } = request.params;
  let getStateQuery = `
        SELECT state_id AS stateId, state_name AS stateName, population
        FROM state
        WHERE state_id = ${stateId}
    `;
  let state = await db.get(getStateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  let districtDetails = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = districtDetails;
  let postDistrictQuery = `
        INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
        VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});
