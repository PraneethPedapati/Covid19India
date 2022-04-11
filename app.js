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

app.get("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let getDistrictQuery = `
        SELECT district_id AS districtId, district_name AS districtName, state_id AS stateId, cases, cured, active, deaths 
        FROM district
        WHERE district_id = ${districtId};
    `;
  let district = await db.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let postDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};
    `;
  await db.run(postDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  let { districtId } = request.params;
  let districtDetails = request.body;
  let { districtName, stateId, cases, cured, active, deaths } = districtDetails;
  let updateDistrictQuery = `
        UPDATE district
        SET district_name='${districtName}', state_id=${stateId}, cases=${cases}, cured=${cured}, active=${active}, deaths=${deaths}
        WHERE district_id=${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  let { stateId } = request.params;
  let getStateStatsQuery = `
        SELECT SUM(district.cases), SUM(district.cured) , SUM(district.active) , SUM(district.deaths)
        FROM state
        INNER JOIN district ON state.state_id = district.state_id
        WHERE state.state_id = ${stateId}
        GROUP BY state.state_id
    `;
  let stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(district.cases)"],
    totalCured: stats["SUM(district.cured)"],
    totalActive: stats["SUM(district.active)"],
    totalDeaths: stats["SUM(district.deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  let { districtId } = request.params;
  let getStateQuery = `
        SELECT state.state_name AS stateName
        FROM state
        INNER JOIN district ON state.state_id = district.state_id
        WHERE district_id = ${districtId};
    `;
  let state = await db.get(getStateQuery);
  response.send(state);
});
