const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

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
  res.status(200).send('Me running fast - DELETE ME BEFORE SUBMIT');
});

/**
 * Returns all words in the dictionary that has the same permutation as the word.
 */
app.get("/api/v1/similar", async (req, res) => {
  const start = process.hrtime();
  const timestamp = new Date();
  const { word } = req.query;
  let similarWords;

  if (!word) {
    return res.status(400).json({
      type: "Validation",
      error: "Word parameter is required in the request body",
    });
  }

  try {
    similarWords = await bl.getSimilarWords(word);
    const requestDuration = getDurationMicroseconds(start);
    await bl.addStatistic(requestDuration, timestamp);
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  } finally {
    res.json({ similar: similarWords });
  }
});

/**
 * Adds a word to the dictionary.
 */
app.post("/api/v1/add-word", async (req, res) => {
  const { word } = req.body;

  if (!word) {
    return res.status(400).json({
      type: "Validation",
      error: "Word parameter is required in the request body",
    });
  }

  try {
    await bl.addWord(word);
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  } finally {
    res.status(200).send(`${word} added to the dictionary successfully!`);
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
      error: "Range parameters 'from' or 'to' are invalid.",
    });
  }

  try {
    statistics = await bl.getStatistics(from, to);
  } catch (error) {
    return res
      .status(400)
      .json({ type: error.type ?? "", error: error.message });
  } finally {
    res.json(statistics);
  }
  res.json({
    totalWords: dictionary.length,
    totalRequests,
    avgProcessingTimeMs: avgProcessingTime,
  });
});

/**
 * Calculates the elapsed time in microseconds since the specified start time.
 * @param {Array<number>} start - The start time captured.
 * @returns {number} The elapsed time in microseconds.
 */
function getDurationMicroseconds(start) {
  const finish = process.hrtime(start);
  const microseconds = parseInt(finish[0] * 1e6 + finish[1] / 1e3);
  return microseconds;
}

function validateDateRange(from, to) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

  // Check if both from and to are undefined
  if (from === undefined && to === undefined) {
    return true;
  }

  // If either from or to is missing or not in the correct format, return false
  if (
    from === undefined ||
    to === undefined ||
    !dateRegex.test(from) ||
    !dateRegex.test(to)
  ) {
    return false;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  return fromDate < toDate;
}
