const mysqlConnection = require("../connection");
const express = require("express");
const router = express.Router();

//get all catogories of current user
router.get("/:store", (req, res) => {
  let sql = `SELECT id,account_store,account_whatsapp,account_store_link,account_store_status,account_store_desc,account_store_address	 FROM account WHERE account_store_link = '${req.params.store}'`;
  let query = mysqlConnection.query(sql, (err, results) => {
    if (err)
      return res
        .status(500)
        .json({ message: { messageBody: err, status: false } });

    return res.status(201).json({ status: true, data: results });
  });
});

//get a specific product
//get specific product
router.get("/products/single/:id", (req, res) => {
  let sql = `SELECT  products.* , GROUP_CONCAT(product_image ORDER BY products_images.id) AS images
    FROM    products 
    LEFT JOIN    products_images
    ON      products_images.product_id = products.id
    WHERE products.id =${req.params.id} 
    GROUP BY products.id`;
  let query = mysqlConnection.query(sql, (err, results) => {
    if (err)
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    return res.json({
      status_code: 200,
      status: true,
      login: true,
      data: results,
    });
  });
});

//get all instock products of user
router.get("/products/:id", (req, res) => {
  let sql = `SELECT  products.* , GROUP_CONCAT(product_image ORDER BY products_images.id) AS images
    FROM    products 
    LEFT JOIN    products_images
    ON      products_images.product_id = products.id
    WHERE product_user='${req.params.id}' AND product_stock !=0
    GROUP BY products.id`;
  let query = mysqlConnection.query(sql, (err, results) => {
    if (err)
      return res.json({
        status_code: 500,
        message: { messageBody: err, status: false },
      });
    return res.json({
      status_code: 200,
      status: true,
      login: true,
      data: results,
    });
  });
});

module.exports = router;