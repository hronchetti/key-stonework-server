import express from 'express'
import nodemailer from 'nodemailer'
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

// CONTACT FORM SEND EMAIL

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

app.post('/sendEmail', CORS(CORSOptions), (req, res) => {
  let mailOptions = {
    from: req.body.email,
    to: 'harryronchetti@gmail.com',
    subject: 'Key stonework website',
    html: `
    <table>
      <tbody>
        <tr>
          <td colspan="2"><h2>New Contact Form Response</h2></td>
        </tr>
        <tr>
          <td><strong>Name:</strong></td>
          <td>${req.body.name}</td>
        </tr>
        <tr>
          <td><strong>Phone:</strong></td>
          <td>${req.body.phone}</td>
        </tr>
        <tr>
          <td><strong>Email:</strong></td>
          <td>${req.body.email}</td>
        </tr>
        <tr>
          <td><strong>Message:</strong></td>
          <td>${req.body.message}</td>
        </tr>
        <tr>
          <td><strong>Preferred stone colour:</strong></td>
          <td>
            ${req.body.stoneColour ? req.body.stoneColour : 'None specified'}
          </td>
        </tr>
        <tr>
          <td>
            <strong>Interested in:</strong>
          </td>
          <td>
            ${req.body.architecturalPieces ? 'Architectural pieces,' : ''}
            ${req.body.ballsCollardBases ? 'Balls & collard bases,' : ''}
            ${req.body.balustrading ? 'Balustrading,' : ''}
            ${req.body.corbels ? 'Corbels,' : ''}
            ${req.body.keystones ? 'Keystones,' : ''}
            ${req.body.pierCaps ? 'Pier caps,' : ''}
            ${req.body.porticos ? 'Porticos,' : ''}
            ${req.body.quions ? 'Quions,' : ''}
            ${req.body.stringsPlinths ? 'Strings & plinths,' : ''}
            ${req.body.wallCoping ? 'Wall coping,' : ''}
            ${req.body.windowCillsHeads ? 'Window cills & heads,' : ''}
            ${req.body.windowSurrounds ? 'Window surrounds,' : ''}
          </td>
        </tr>
      </tbody>
    </table>`,
  }

  if (req.body.email && req.body.name && req.body.message && req.body.phone) {
    transporter
      .sendMail(mailOptions)
      .then(() => {
        res.json({ message: 'Success' })
      })
      .catch(() => {
        res.json({ message: 'Error' })
      })
  } else {
    res.json({ message: 'User error' })
  }
})

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

app.listen(3000)
