const CustomError = require("../helpers/customError");
const { sortWordAlphabetically } = require("../helpers/miscHelpers");

class BusinessLogicLayer {
  constructor(dataAccessLayer) {
    this.dal = dataAccessLayer;
  }

  /**
   * Retrieves similar words for a given word.
   * @param {string} word - The word for which similar words are to be retrieved.
   * @returns {Promise<Array<string>>} Array of similar words, or an empty array if no similar words are found.
   */
  async getSimilarWords(word) {
    let similarWords = [];

    // Checks whether the word's alphabetical key exists in the dictionary.
    const key = sortWordAlphabetically(word);
    const keyFound = await this.dal.findKey(key);

    // If the key does not exist, return an empty array.
    if (!keyFound) {
      return similarWords;
    }

    // Retrieve similar words for the given key.
    similarWords = await this.dal.getSimilarWords(key);

    return similarWords;
  }

  /**
   * Adds a new word to the dictionary.
   * @param {string} word - The word to be added to the dictionary.
   * @throws {CustomError} Throws an error if the word already exists in the dictionary.
   */
  async addWord(word) {
    // Checks whether the word already exists in the dictionary.
    const wordFound = await this.dal.findWord(word);

    // If the word already exists, throw a CustomError.
    if (wordFound) {
      throw new CustomError(
        "Word exists",
        `The word '${word}' is already in the dictionary.`
      );
    }

    // Add the word to the dictionary.
    await this.dal.addWord(word);
  }

  /**
   * Adds a new statistic record to the database.
   * @param {number} requestDuration - The duration of the request in milliseconds.
   * @param {Date} timestamp - The timestamp of when the request was made.
   */
  async addStatistic(requestDuration, timestamp) {
    await this.dal.addStatistic(requestDuration, timestamp);
  }

  /**
   * Retrieves statistics data from the database within the specified date range.
   * @param {Date|null} [from=null] - The start date of the date range (inclusive). If not provided, retrieves statistics from the earliest available date.
   * @param {Date|null} [to=null] - The end date of the date range (inclusive). If not provided, retrieves statistics up to the current date.
   * @returns {Promise<Object>} Object containing statistics data.
   * @property {number} totalWords - The total number of words in the dictionary.
   * @property {number} totalRequests - The total number of requests recorded in the specified date range.
   * @property {number} avgProcessingTimeMs - The average processing time of requests in milliseconds within the specified date range.
   */
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

  /**
   * Retrieves the size of the dictionary from the database.
   * @returns {Promise<number>} Size of the dictionary.
   */
  async getDictionarySize() {
    const dictionarySize = await this.dal.getDictionarySize();
    return dictionarySize;
  }
}

module.exports = BusinessLogicLayer;
