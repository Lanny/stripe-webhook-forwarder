#!/usr/bin/env node

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 1337


const registeredKeys = {
}

const urlToKeyMap = {
}

const registerNewHook = (key) => {
  registeredKeys[key] = {
    forwardTargets: [],
    key,
  }
}

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/register', (req, res) => {
  const { stripe_key, url, ttl } = req.body
  if (!stripe_key) {
    res.status(400).json({
      'status': 'FAILED',
      'reason': 'Missing `stripe_key` param.',
    })
    return
  }

  if (!url) {
    res.status(400).json({
      'status': 'FAILED',
      'reason': 'Missing `url` param.',
    })
    return
  }

  const numericTTL = Number(ttl)
  if (isNaN(numericTTL)) {
    res.status(400).json({
      'status': 'FAILED',
      'reason': 'Missing or invalid `ttl` param.',
    })
    return
  }

  if (!registeredKeys[stripe_key]) {
    registerNewHook(stripe_key)
  }

  registeredKeys[stripe_key].forwardTargets.push({
    expires: Date.now() + numericTTL * 1000,
    url,
  })

  res.status(201).json({
    'status': 'SUCCESS'
  })
})

app.get('/info/registrants', (req, res) => {
  const resp = {}
  for (let key in registeredKeys) {
    const maskedKey = `${key.substring(0, 5)}...${key.substring(key.length - 3)}`
    resp[maskedKey] = registeredKeys[key].forwardTargets
  }

  res.status(200).json(resp)
})

app.get('/webhook/stripe.json', (req, res) => {
  res.send('Hello World!')
})

app.set('json spaces', 2);
app.listen(port, () => console.log(`Stripe webhook forwarder running on port ${port}`))
