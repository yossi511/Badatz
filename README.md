### Running the project
In order to run the project you need run the docker-compose, with the command: `docker-compose up`.
The project is replicated with 3 server instances, in order to handle traffic.
Also the project is running on port 3060, in address `http://localhost:3060`.

### Explaining my solution
In order to resolve faster read time and prevent searches, I decided to store the words in a key-value manner,
whereas the key is the core permutation that's alphabetically sorted and the value is a list of all permutations in the dictionary.
For example, if the dictionary has the words: `pepla`, `ppela`, `apple`. Then their key is: `aelpp`, 
and it'll be stored like this: `{key: 'aelpp', words_list: ['pepla', 'ppela', 'apple']}`.
In the begining I initialize the db in that order, and later on, upon adding a word I can locate the key fast and update it quickly, making the 
similar request easy to be made, since it's easy access.
