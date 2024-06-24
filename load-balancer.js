const { error } = require("console");
const express = require("express");
const app = express();
const http = require("http");

const port = 3001;

//list of backend servers
const servers = [
  { host: "localhost", port: 3005 },
  { host: "localhost", port: 3006 },
];
let currentServerIndex = 0;
//Round robin function to get next server
const getNextServer = () => {
  const server = servers[currentServerIndex];
  currentServerIndex = (currentServerIndex + 1) % servers.length;

  return server;
};

app.use((req, res) => {
  console.log("Received request from", req.ip);
  console.log(req.method, req.url);
  console.log(req.headers);

  const server = getNextServer();
  console.log(`Forwarding request to ${server.host}:${server.port}`);

  //Forward the request to backend server
  const options = {
    hostname: server.host,
    port: server.port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (backenRes) => {
    let data = "";
    backenRes.on("data", (chunk) => {
      data += chunk;
    });

    backenRes.on("end", () => {
      const statusCode = backenRes.statusCode || 500; // Default to 500 if statusCode is undefined
      const statusMessage = backenRes.statusMessage || "Internal Server Error";
      res.status(statusCode).send(data);
      console.log(
        "Response from server:",
        `${backenRes.httpVersion},${statusCode},${statusMessage}`
      );
      console.log(data);
    });
  });

  proxy.on("error", (error) => {
    console.error("Error with request to backend", error.message);
    res.status(500).send("Internal server error");
  });

  //Pipe the request body to backend server
  req.pipe(proxy);
});

app.listen(port, () => {
  console.log(`Load balancer running at http:localhost:${port}`);
});
