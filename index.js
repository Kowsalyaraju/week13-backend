const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection

mongoose.connect("mongodb://127.0.0.1:27017/bulkmail")
  .then(function () {
    console.log("Database Connected");
  })
  .catch(function (error) {
    console.log("Failed to Connect to Database");
    console.log(error)
  });

// Existing Collection (Gmail Credentials)

const storedmail = mongoose.model("storedmail", {}, "maildata");

// New Collection (Mail History)

const mailhistory = mongoose.model(
  "mailhistory",
  {
    subject: String,
    body: String,
    recipients: [String],
    status: String,
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  "history"
);

// Send Mail API

app.post("/sendmail", function (req, res) {
  const sub = req.body.sub;
  const text = req.body.text;
  const emaillist = req.body.emaillist;

  storedmail.find().then(function (data) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: data[0].toJSON().email,
        pass: data[0].toJSON().pass,
      },
    });

    new Promise(async function (resolve, reject) {
      try {
        for (let i = 0; i < emaillist.length; i++) {
          await transporter.sendMail({
            from: data[0].toJSON().email,
            to: emaillist[i],
            subject: sub,
            text: text,
          });

          console.log("Sent to:", emaillist[i]);
        }

        resolve("Successful");
      } catch (error) {
        console.log(error);
        reject("Failed");
      }
    })

      .then(async function () {
        // Save Success History

        await mailhistory.create({
          subject: sub,
          body: text,
          recipients: emaillist,
          status: "Success",
        });

        res.send(true);
      })

      .catch(async function () {
        // Save Failed History

        await mailhistory.create({
          subject: sub,
          body: text,
          recipients: emaillist,
          status: "Failed",
        });

        res.send(false);
      });
  });
});



app.listen(5000, () => {
  console.log("Server Started.........");
});