const CustomError = require("../helpers/customError");
const { sortWordAlphabetically } = require("../helpers/miscHelpers");

class BusinessLogicLayer {
  constructor(dataAccessLayer) {
    this.dal = dataAccessLayer;
  }

  async getSimilarWords(word) {
    let similarWords = [];
    // Checks wether word alphabetical key exists in the dictionary.
    const key = sortWordAlphabetically(word);
    const keyFound = await this.dal.findKey(key);
    if (!keyFound) {
      return similarWords;
    }
    similarWords = await this.dal.getSimilarWords(key);
    return similarWords;
  }

  async addWord(word) {
    // Checks wether word already in the dictionary.
    const wordFound = await this.dal.findWord(word);
    if (wordFound) {
      throw new CustomError(
        "Word exists",
        `The word: ${word} is already in the dictionary.`
      );
    }
    await this.dal.addWord(word);
  }

  async addStatistic(requestDuration, timestamp) {
    await this.dal.addStatistic(requestDuration, timestamp);
  }

  async getStatistics(from = null, to = null) {
    let statistics = await this.dal.getStatistics(from, to);
    const totalWords = await this.getDictionarySize();
    const totalRequests = statistics.length;
    const totalDuration = statistics.reduce(
      (total, stat) => total + stat.request_duration,
      0
    );
    const avgProcessingTimeMs = parseInt(totalDuration / totalRequests);

    return {
      totalWords,
      totalRequests,
      avgProcessingTimeMs,
    };
  }

  async getDictionarySize() {
    const dictionarySize = await this.dal.getDictionarySize();
    return dictionarySize;
  }
}

module.exports = BusinessLogicLayer;
