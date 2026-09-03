require("dotenv").config();

const path = require("path");
const express = require("express");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const frontDir = path.join(__dirname, "..", "front");

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontDir));

app.use("/api", routes);

app.get("*", (req, res) => {
  res.sendFile(path.join(frontDir, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
