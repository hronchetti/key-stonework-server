import express from 'express'
import CORS from 'cors'
import multer from 'multer'
import fileSystem from 'file-system'
import compression from 'compression'

require('dotenv').config({ path: '.env' })

const app = express()
app.use(express.json())
app.use(CORS())
app.use(compression())

const whitelist = [
  'http://localhost:8000',
  'https://key-stonework.netlify.app',
  'https://keystonework.co.uk',
]

const CORSOptions = {
  origin: (origin, callback) => {
    whitelist.indexOf(origin) !== -1
      ? callback(null, true)
      : callback(new Error('Not allowed by CORS'))
  },
}

// ADMIN LOGIN

app.post('/login', CORS(CORSOptions), (req, res) => {
  if (
    req.body.user === process.env.ADMIN_USER &&
    req.body.password === process.env.ADMIN_PASSWORD
  ) {
    res.json({ message: 'Success' })
  } else {
    res.json({ message: 'Error' })
    console.log
  }
})

// ADMIN STORE IMAGES

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, 'uploads/')
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storage }).array('photos')

app.post('/savePhotos', CORS(CORSOptions), (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.json({ message: 'Files not stored' })
    } else if (err) {
      res.json({ message: 'General error' })
    }
    res.json({ message: 'Success', files: req.files })
  })
})

app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(
  '/latestProjects.json',
  express.static(__dirname + '/latestProjects.json')
)

// ADMIN REMOVE IMAGE

app.post('/removePhoto', CORS(CORSOptions), (req, res) => {
  fileSystem.unlink(`uploads/${req.body.photo}`, (error) => {
    if (error) {
      res.json({ message: 'Error' })
      console.log(error)
    } else {
      res.json({ message: 'Success' })
    }
  })
  console.log(req.body.photo)
})

// ADMIN SAVE NEW PROJECT

app.post('/saveProject', CORS(CORSOptions), (req, res) => {
  fileSystem.readFile('latestProjects.json', (err, data) => {
    if (err) {
      res.json({ message: 'Error finding latest projects' })
    } else {
      let existingProjects = JSON.parse(data)
      let allProjects = [...existingProjects, req.body]
      let allProjectsJSON = JSON.stringify(allProjects)

      fileSystem.writeFile('latestProjects.json', allProjectsJSON, (err) => {
        if (err) {
          res.json({ message: 'Error adding new project' })
        } else {
          res.json({ message: 'Success' })
        }
      })
    }
  })
})

app.listen(process.env.PORT || 3000)
