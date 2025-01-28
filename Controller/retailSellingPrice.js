const pool = require('../db/db');
const moment = require('moment');

exports.addsellingprice = async (req, res) => {
    try {
        
        const { ms, hsd, speed, cng,created_at} = req.body;

        const existingPrice = await pool.query(
            `SELECT * FROM retailsellingprice WHERE "created_at" = $1`,
            [created_at]
        );

        if (existingPrice.rows.length > 0) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Price for the given date already exists',
                existingPrice: existingPrice.rows[0],
            });
        }


        const sellingprice = await pool.query(
            `INSERT INTO retailsellingprice("ms", "hsd", "speed","cng","created_at") 
             VALUES ($1, $2, $3, $4,$5) 
             RETURNING *`,
            [ ms, hsd, cng,speed,created_at]
        );

        res.status(200).json({
            statusCode: 200,
            message: 'Price added successfully',
            sellingprices: sellingprice.rows[0],
        });
    } catch (err) {
        console.error('Error add selling price:', err.message);
        res.status(500).json({ error: 'Failed to insert price' });
    }
};


exports.getallprices = async (req, res) => {
    try {
        const getallprices = await pool.query("SELECT * FROM retailsellingprice");
        res.status(200).json({
            statusCode: 200,
            message: 'list prices fetched sucessfully',
            prices: getallprices.rows
        })
    } catch (err) {
        res.status(500).json({ error: 'failed to fetched prices' })
    }
}

exports.getpricesbyid = async (req, res) => {
    try {
        const { rsp_id } = req.body
        const price = await pool.query(
            "SELECT * FROM retailsellingprice WHERE res_id=$1",
            [rsp_id]
        );
        if (price.rows.length === 0) {
            return res.status(404).json({ error: "Price not Found" })
        }
        res.status(200).json({
            statusCode: 200,
            message: 'price fetched Sucessfully',
            price: price.rows[0]
        })
    } catch (err) {
        res.status(500).json({ error: 'failed to fetched price' })
    }

}


exports.getpricebydate = async (req, res) => {
    try {
        const { created_at } = req.body;

       
        const formattedDate = moment(created_at, "DD-MM-YYYY").format("YYYY-MM-DD");

         const pricedate = await pool.query(
            "SELECT * FROM retailsellingprice WHERE created_at = $1",
            [formattedDate]
        );

         
        if (pricedate.rows.length === 0) {
            return res.status(404).json({
                statusCode: 404,
                message: "No records found for the given date",
            });
        }

        
        const formattedPrices = pricedate.rows.map(record => ({
            ...record,
            date: moment(record.created_at).format("DD-MM-YYYY"),  
        }));

        res.status(200).json({
            statusCode: 200,
            message: "Prices fetched successfully",
            prices: formattedPrices,
        });
    } catch (err) {
        console.error("Error fetching prices by date:", err.message);
        res.status(500).json({ error: "Failed to fetch prices" });
    }
};



exports.updatePrice = async (req, res) => {
    try {
        const { rsp_id,
            date, ms, psd, speed
        } = req.body
        const fields = [];
        const values = [];
        let index = 1
        if (created_at) {
            fields.push(`"date"=$${index++}`);
            values.push(created_at)
        }
        if (ms) {
            fields.push(`"ms"=$${index++}`);
            values.push(ms)
        }
        if (hsd) {
            fields.push(`"psd"=$${index++}`);
            values.push(psd)
        }
        if (speed) {
            fields.push(`"speed"=$${index}`);
            values.push(speed)
        }

        values.push(rsp_id)
        if (fields.length === 0) {
            return res.status(400).json({
                statusCode: 400,
                message: 'No Fileds provided to Update'
            })
        }

        const query = `update retailsellingprice
      SET ${fields.join(',')}
      WHERE "rsp_id"=$${index}
      RETURNING *`

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({
                statusCode: 400,
                message: 'price not Found'
            })
        }
        res.status(200).json({
            statusCode: 200,
            message: "Update Sucessfully",
            price: result.rows[0]
        })

    } catch (error) {
        res.status(500).json({ error: 'Failed to Fetched Price' })
    }
}