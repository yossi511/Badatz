const { Pool } = require("pg");
const fs = require("fs");
const CustomError = require("../helpers/customError");
const { sortWordAlphabetically } = require("../helpers/miscHelpers");
const path = require("path");

let keys = require("./dbConfig");
const WORDS_DATASET_PATH = path.resolve(__dirname, "../data/words_dataset.txt");

class DataAccessLayer {
  constructor() {
    this.pool = new Pool({
      user: keys.pgUser,
      host: keys.pgHost,
      database: keys.pgDatabase,
      password: keys.pgPassword,
      port: keys.pgPort,
    });
  }

  /**
   * Checks if tables ('words' and 'stats') exist in the database.
   * @returns {Promise<boolean>} - Boolean indicating whether both tables exist or not.
   */
  async checkTablesCreated() {
    const client = await this.pool.connect();
    try {
      const query = `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('words', 'stats')
            );
        `;
      const result = await client.query(query);
      return result.rows[0].exists;
    } catch (error) {
      console.error(
        "Error checking tables 'words' and 'stats' existence:",
        error
      );
    } finally {
      client.release();
    }
  }

  /**
   * Creates tables ('words' and 'stats').
   */
  async createDatabases() {
    const client = await this.pool.connect();
    try {
      const createWordsQuery = `
          CREATE TABLE words (
            key TEXT PRIMARY KEY,
            words_list TEXT[]
          );
      `;
      await client.query(createWordsQuery);

      const createStatsQuery = `
          CREATE TABLE stats (
            request_duration INTEGER,
            timestamp TIMESTAMP,
            PRIMARY KEY (request_duration, timestamp)
          );
      `;
      await client.query(createStatsQuery);
    } catch (error) {
      console.error("Error creating tables 'words' and 'stats':", error);
    } finally {
      client.release();
    }
  }

  /**
   * Initializes the words db with the data set path.
   */
  async initWordsDb() {
    try {
      const data = fs.readFileSync(WORDS_DATASET_PATH, "utf8");
      const words = data.split("\r\n");
      // Sorts word into dictionary - (<alphabetical key>:[<words>])
      const dictionary = words.reduce((dict, currentWord) => {
        const key = sortWordAlphabetically(currentWord);
        if (!dict.hasOwnProperty(key)) {
          dict[key] = [];
        }
        dict[key].push(currentWord);
        return dict;
      }, {});
      await this.initDictionary(dictionary);
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  /**
 * Initializes the dictionary by slitting the dict into batches,
 * The dictionary is sorted beforhand by alphabetical keys.
 * @param {Object.<string, string[]>} dictionary - The dictionary object where keys are words and values are arrays of related words.
 * @returns {Promise<void>} - A Promise that resolves when all words are added successfully.
 */
  async initDictionary(dictionary) {
    const client = await this.pool.connect();
    try {
      const batchSize = 50000;
      const keys = Object.keys(dictionary);
      const totalKeys = keys.length;
      let index = 0;
      while (index < totalKeys) {
        const batchKeys = keys.slice(index, index + batchSize);
        await client.query("BEGIN");
        const values = [];
        for (const key of batchKeys) {
          values.push(`('${key}', '{${dictionary[key].join(",")}}')`);
        }
        const query =
          "INSERT INTO words (key, words_list) VALUES " +
          values.join(", ") +
          " ON CONFLICT (key) DO UPDATE SET words_list = EXCLUDED.words_list";
        await client.query(query, []);
        await client.query("COMMIT");
        index += batchSize;
      }
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error adding words to keys in table:", error);
      throw new CustomError("CRUD", "Error adding words to keys in table");
    } finally {
      client.release();
    }
  }

  /**
   * Initializes the whole data access layer.
   */
  async initDal() {
    const tablesCreated = await this.checkTablesCreated();
    if (!tablesCreated) {
      await this.createDatabases();
      await this.initWordsDb();
    } else {
      const wordsCount = (await this.read("words")).length;
      if (wordsCount == 0) await this.initWordsDb();
    }
  }

  /**
   * Adds a word to the word list associated with the unique key in the words db.
   * @param {string} word - The word to add to the words db.
   */
  async addWord(word) {
    const client = await this.pool.connect();
    try {
      const key = sortWordAlphabetically(word);
      const query = "INSERT INTO words (key, words_list) VALUES ($1, ARRAY[$2]) ON CONFLICT (key) DO UPDATE SET words_list = array_append(words.words_list, $2)";
      await client.query(query, [key, word]);
    } catch (error) {
      console.error("Error adding word to words table:", error);
      throw new CustomError("CRUD", "Error adding word to words table");
    } finally {
      client.release();
    }
  }

  /**
   * Finds wether a word is in the words db.
   * @param {string} word - The word to search for.
   * @returns {Promise<boolean>} - Boolean indicating whether the word exists in the db or not.
   */
  async findWord(word) {
    const client = await this.pool.connect();
    try {
      const key = sortWordAlphabetically(word);
      const query =
        "SELECT EXISTS (SELECT 1 FROM words WHERE key = $1 AND $2 = ANY(words_list)) AS exists";
      const result = await client.query(query, [key, word]);
      return result.rows[0].exists;
    } catch (error) {
      console.error("Error finding word in words table:", error);
      throw new CustomError("CRUD", "Error finding word in words table");
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves the total size of the dictionary.
   * @returns {Promise<number>} - Total size of the dictionary.
   */
  async getDictionarySize() {
    const client = await this.pool.connect();
    try {
      const query =
        "SELECT SUM(ARRAY_LENGTH(words_list, 1)) AS total_size FROM words";
      const result = await client.query(query);
      const totalSize = result.rows[0].total_size;
      return totalSize;
    } catch (error) {
      console.error("Error getting dictionary size:", error);
      throw new CustomError("CRUD", "Error getting dictionary size:");
    } finally {
      client.release();
    }
  }

  /**
   * Finds wether a key is in the words db.
   * @param {string} key - The key to search for.
   * @returns {Promise<boolean>} - Boolean indicating whether the key exists in the db or not.
   */
  async findKey(key) {
    const client = await this.pool.connect();
    try {
      const query =
        "SELECT EXISTS (SELECT 1 FROM words WHERE key = $1) AS exists";
      const result = await client.query(query, [key]);
      return result.rows[0].exists;
    } catch (error) {
      console.error("Error finding key in words table:", error);
      throw new CustomError("CRUD", "Error finding key in words table");
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves the similar words associated with the given key from the dictionary.
   * @param {string} key - The key to search for.
   * @returns {Promise<Array<string>>} - Array of similar words to the key.
   */
  async getSimilarWords(key) {
    const client = await this.pool.connect();
    try {
      const query = "SELECT words_list FROM words WHERE key = $1";
      const result = await client.query(query, [key]);
      return result.rows[0].words_list;
    } catch (error) {
      console.error("Error retrieving word list for key:", error);
      throw new CustomError("CRUD", "Error retrieving similar words for key");
    } finally {
      client.release();
    }
  }

  /**
   * Adds a new statistic entry to the stats db.
   * @param {number} requestDuration - The duration of the request in milliseconds.
   * @param {Date} timestamp - The timestamp indicating when the request occurred.
   */
  async addStatistic(requestDuration, timestamp) {
    const client = await this.pool.connect();
    try {
      const query =
        "INSERT INTO stats (request_duration, timestamp) VALUES ($1, $2)";
      await client.query(query, [requestDuration, timestamp]);
    } catch (error) {
      console.error("Error adding statistic:", error);
      throw new CustomError("CRUD", "Error adding statistic");
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves statistics from the stats db.
   * @param {Date|null} from - The starting timestamp to filter the statistics. If null, no lower limit is applied.
   * @param {Date|null} to - The ending timestamp to filter the statistics. If null, no upper limit is applied.
   * @returns {Promise<Array<{ request_duration: number, timestamp: Date }>>} - Array of objects representing the retrieved statistics.
   */
  async getStatistics(from = null, to = null) {
    const client = await this.pool.connect();
    try {
      let query = "SELECT request_duration, timestamp FROM stats";

      let values = [];
      if (from !== null && to !== null) {
        query += " WHERE timestamp >= $1 AND timestamp <= $2";
        values = [from, to];
      }

      const result = await client.query(query, values);
      return result.rows;
    } catch (error) {
      console.error("Error retrieving statistics:", error);
      throw new CustomError("CRUD", "Error retrieving statistics");
    } finally {
      client.release();
    }
  }
}

module.exports = DataAccessLayer;
