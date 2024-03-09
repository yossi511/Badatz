const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const {
  getDurationMicroseconds,
  validateDateRange,
  validateWord,
} = require("./helpers/miscHelpers");
const BusinessLogicLayer = require("./bl/businessLogicLayer");
const DataAccessLayer = require("./dal/dataAccessLayer");

app.use(cors());

app.use(bodyParser.json());

let bl;

(async () => {
  const dal = new DataAccessLayer();
  await dal.initDal();
  bl = new BusinessLogicLayer(dal);

  app.listen(5000, () => console.log("Server is running on port 5000"));
})();

app.get("/", async (req, res) => {
  res.status(200).send("Me running fast - DELETE ME BEFORE SUBMIT");
});

/**
 * Returns all words in the dictionary that has the same permutation as the word.
 */
app.get("/api/v1/similar", async (req, res) => {
  const start = process.hrtime();
  const timestamp = new Date();
  const { word } = req.query;
  let similarWords;

  if (!validateWord(word)) {
    return res.status(400).json({
      type: "Validation",
      error: "word parameter is missing/invalid.",
    });
  }

  try {
    similarWords = await bl.getSimilarWords(word);
    const requestDuration = getDurationMicroseconds(start);
    await bl.addStatistic(requestDuration, timestamp);
    res.json({ similar: similarWords });
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  }
});

/**
 * Adds a word to the dictionary.
 */
app.post("/api/v1/add-word", async (req, res) => {
  const { word } = req.body;

  if (!validateWord(word)) {
    return res.status(400).json({
      type: "Validation",
      error: "word parameter is missing/invalid.",
    });
  }

  try {
    await bl.addWord(word);
    res.status(200).send(`${word} added to the dictionary successfully!`);
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  }
});

/**
 * Return general statistics about the word querying.
 */
app.get("/api/v1/stats", async (req, res) => {
  const { from, to } = req.query;
  let statistics = {};

  if (!validateDateRange(from, to)) {
    return res.status(400).json({
      type: "Validation",
      error: "Time filter is partially missing/invalid.",
    });
  }

  try {
    statistics = await bl.getStatistics(from, to);
    res.json(statistics);
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  }
});
