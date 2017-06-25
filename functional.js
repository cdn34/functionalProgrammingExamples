const Task = require('data.task')
const fs = require('fs')
const request = require('request');

//This part is already done by other libraries and it's only mean to serve as an example
//------------------------------------------
//Either === Left || Right
const Right = x =>
({
	chain: f => f(x),
	map: f => Right(f(x)),
	fold: (f, g) => g(x),
	inspect: _ => `Right(${x})`,
});

const Left = x =>
({
	chain: f => Left(x),
	map: f => Left(x),
	fold: (f, g) => f(x),
	inspect: _ => `Left(${x})`,
});

const tryCatch = f => {
	try {
		return Right(f());
	} catch(e) {
		return Left(e);
	}
}
//------------------------------------------

const eitherToTask = e => //console.log("eitherToTask: ",e);
	e.fold(Task.rejected, Task.of);
  

const writeFile = (name, contents) =>
  new Task((rej, res) =>
    fs.writeFile(name, contents, (err, _) =>
      err ? rej(err) : res("Success!")))

const fetch = (url, options) =>
  new Task((rej, res) =>
    request(url, (error, response, body) =>
    error ? rej(error) : res(body)))

const app =
  fetch("https://jsonplaceholder.typicode.com/users",{})				//Returns a Task
	.map(contents => tryCatch( _ => JSON.parse(contents)))				//Returns an Task(Either --> Right || Left)
	.chain(convertVal => eitherToTask(convertVal)) 								//Converts Either to Task
	//.map(contents => {console.log(contents); return contents})
  .map(json => json.map(c => (c.name += " - (Edited)") && c))		//Return a Task
	.map(json => tryCatch( _ => JSON.stringify(json)))						//Returns an Task(Either --> Right || Left)
	.chain(convertVal => eitherToTask(convertVal)) 								//Converts Either to Task
  .chain(jsonString => writeFile('dataTask.json',  jsonString))

app.fork(console.error, console.log)														//Executes app
//Everything is composable!


