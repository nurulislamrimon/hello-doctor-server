const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.wg5pc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const servicesCollection = client.db("services").collection("service");
        const appointmentCollection = client.db("services").collection("appointment");
        // read services
        app.get('/services', async (req, res) => {
            const date = req.query.date || 'Jun 22, 2022';
            const query = { 'date': date };
            const services = await servicesCollection.find().toArray();
            const appointment = await appointmentCollection.find(query).toArray();
            services.forEach(service => {
                const bookedAppointment = appointment.filter(a => a.serviceName === service.name);
                const bookedSlot = bookedAppointment.map(a => a.time)
                service.slots = service.slots.filter(s => !bookedSlot.includes(s))
            })
            res.send(services)
            console.log('Available services responding');
        })
        // booking services
        app.post('/appointment', async (req, res) => {
            const newAppointment = req.body;
            const name = newAppointment.serviceName;
            const email = newAppointment.email;
            const date = newAppointment.date;
            const query = { "serviceName": name, email, date }
            const find = await appointmentCollection.find(query).toArray();
            if (find.length) {
                return res.send({ result: "You have a appointment in this day!" })
            }
            const result = await appointmentCollection.insertOne(newAppointment);
            res.send(result);
            console.log(find);
        })

    } finally {

    }
}
run().catch(console.log)


app.get('/', (req, res) => {
    res.send('hello');
})
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})