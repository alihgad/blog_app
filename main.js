const express = require("express")
const cors = require("cors")
const mysql2 = require("mysql2/promise")
const app = express()
const port = 3000

let db
let getDbConnection = async () => {
  if (db) {
    console.log("db already exists")
    return db
  }
  db = mysql2.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    database: "sat",
    password: "",
    waitForConnections: true,
    connectionLimit: 10
  })

  return db
}

getDbConnection()

app.use(cors())
app.use(express.json())




app.post("/signup", async (req, res, next) => {
  let db = await getDbConnection()

  let { firstName, lastName, email, u_password, gender, DOB } = req.body

  let [result] = await db.execute(
    'INSERT INTO `users` (`firstName` , `lastName`, `email` , `u_password` , `gender` , `DOB`) values (?,?,?,?,?,?)',
    [firstName, lastName, email, u_password, gender, DOB])

  res.status(201).json({ result })
})



app.post("/login", async (req, res, next) => {
  let db = await getDbConnection()

  let { email, u_password } = req.body

  let query = "SELECT * from `users` WHERE email = ? and u_password = ?"

  let [result] = await db.execute(query, [email, u_password])

  if (!result.length) return res.status(404).json({ message: "Wrong credentials" })

  res.status(200).json({ result })
})

app.get("/allUsers", async (req, res, next) => {


  let findQuery = 'SELECT u.id , CONCAT(u.firstName , u.lastName) as fullName , ( YEAR(CURDATE()) - u.DOB) as age , u.email , b.title , b.content FROM users as u JOIN `blogs` as b on  u.id = b.authorId '
  let [result] = await db.execute(findQuery)

  res.status(200).json({ message: "user founded", result })
})



app.post("/blog", async (req, res, next) => {
  let db = await getDbConnection()
  let [result] = await db.execute(
    'INSERT INTO `blogs` (`authorId` , `title` , `content`) values (?,?,?)',
    Object.values(req.body)).catch((e) => {
      throw new Error(e.message, { cause: 500 })
    })

  res.status(201).json({ result })
})

app.put("/updateBlog/:id/:userId", async (req, res, next) => {
  let db = await getDbConnection()

  let { id, userId } = req.params

  let updateQuery = " UPDATE `blogs` SET "
  let bindingArr = []

  let entries = Object.entries(req.body)
  for (const [key, value] of entries) {
    updateQuery += ` ${key} = ? ,`
    bindingArr.push(value)
  }

  updateQuery = updateQuery.slice(0, -1)
  updateQuery += "WHERE id = ? AND authorId = ?"
  bindingArr.push(id)
  bindingArr.push(userId)

  let [result] = await db.execute(updateQuery, bindingArr)

  if (!result.affectedRows) return res.status(404).json({ message: "blog not found" })

  res.status(201).json({ result })
})

app.delete("/deleteBlog/:id/:userId", async (req, res, next) => {
  let db = await getDbConnection()

  let { id, userId } = req.params

  let [result] = await db.execute('Delete FROM BLOGS WHERE id = ? AND authorId = ?', [ id, userId ])

  if (!result.affectedRows) return res.status(404).json({ message: "blog not found" })

  res.status(201).json({ result })
})

app.get("/:id", async (req, res, next) => {
  let { id } = req.params

  let findQuery = 'SELECT u.id , CONCAT(u.firstName , u.lastName) as fullName , ( YEAR(CURDATE()) - u.DOB) as age , u.email , b.title , b.content FROM users as u JOIN `blogs` as b on  u.id = b.authorId  WHERE u.id = ?'
  let [result] = await db.execute(findQuery, [id])

  res.status(200).json({ message: "user founded", result })
})



app.put("/update/:id", async (req, res, next) => {
  let { id } = req.params

  let updateQuery = " UPDATE `users` SET "
  let bindingArr = []

  let entries = Object.entries(req.body)
  for (const [key, value] of entries) {
    updateQuery += ` ${key} = ? ,`
    bindingArr.push(value)
  }
  updateQuery = updateQuery.slice(0, -1)
  updateQuery += "WHERE id = ?"
  bindingArr.push(id)

  let [result] = await db.execute(updateQuery, bindingArr)

  if (!result.affectedRows) return res.status(404).json({ message: "user not found" })

  res.status(200).json({
    message: "user updated",
    result
  })

})

app.delete("/delete/:id", async (req, res, next) => {
  let { id } = req.params

  let deleteQuery = "DELETE FROM `users` WHERE id = ?"
  let [result] = await db.execute(deleteQuery, [id])
  if (!result.affectedRows) return res.status(404).json({ message: "user not found" })

  res.status(200).json({
    message: "user deleted",
    result
  })
})



app.listen(port, () => {
  console.log("server is running on port" + port)
})