## Task
Your task is to create a service for querying *similar* words in the English language.
Two words w_1 and w_2 are considered *similar* if w_1 is a letter permutation of w_2 (e.g., "stressed" and "desserts", contains the same character but in different order).

We provide a dataset of the English dictionary you should work with, the file `words_dataset.txt`.

#### Requirements

- backend service that will provide the following API endpoints:
    - GET   /api/v1/similar?word=stressed
        Returns all words in the dictionary that has the same permutation as the word "stressed". The word in the query should not be returned.

        The result format is a JSON object as follows:
        ```json
        {
            "similar":[<list,of,words,that,are,similar,to,provided,word>]
        }
        ```

        For example:
        http://localhost:8000/api/v1/similar?word=apple
        would return `{"similar":["appel","pepla"]}`
    - Post  /api/v1/add-word
        Add a word to the dictionary. The word should be added to the dictionary and be available for future queries.
        The request body should be a JSON object as follows:
        ```json
        {
            "word":"<word to add>"
        }
        ```

        For example:
        ```json
        {
            "word":"apple"
        }
        ```
        would add the word "apple" to the dictionary. return 200 status code on success, 400 on failure.
    - GET /api/v1/stats
        Return general statistics about the word querying(about the `/api/v1/similar` endpoint):
        - Total number of words in the dictionary
        - Total number of requests to the `/api/v1/similar` endpoint.
        - Average time for request handling in microseconds (not including "stats" requests)
        - **bonus**: Add optional parameter to query time-frame for the stats, for example: /api/v1/stats?from=2021-01-01T00:00:00&to=2021-01-02T00:00:00

        The output is a JSON object structured as follows:
        ```json
        {
            "totalWords":<int>,
            "totalRequests":<int>,
            "avgProcessingTimeMs":<int>,
        }
        ```

        For example:
        http://localhost:8000/api/v1/stats
        {"totalWords":351075,"totalRequests":9,"avgProcessingTimeNs":45239}

- a db to store and query the words.
- **bonus**: a simple frontend to interact with the backend service,OR a cli tool to interact with the backend service.
you can use any technology you like for the frontend/cli tool.

The entire thing should be containerized or serverless.

Misc:
* Please shortly describe the algorithm you use to get the similar words.
* Use any popular programming language you like.
* Please do expect a **high rate of requests arriving in parallel**.
* Use any framework and technology you like.
* The source code can be submitted as a private repo in github, or by bundling the repo with `git bundle` command (for example `git bundle create submission.bundle --all` would create a file `submission.bundle` that contains the entire repo and can later be cloned with `git clone submission.bundle`).
* Include a clear readme file with instructions on how to run the system and any other relevant information.

