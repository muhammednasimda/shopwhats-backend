const mysqlConnection = require("../../connection");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");

//get all products of current user
router.get("/", (req, res) => {
  let sql = `SELECT  products.* , GROUP_CONCAT(product_image ORDER BY products_images.id) AS images
    FROM    products 
    LEFT JOIN    products_images
    ON      products_images.product_id = products.id
    WHERE product_user=${req.user.user.id}
    GROUP BY products.id`;
  //let sql = `SELECT *FROM products WHERE product_user=${user[0].id}`
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

//get specific product
router.get("/:id", (req, res) => {
  let sql = `SELECT  products.* , GROUP_CONCAT(product_image ORDER BY products_images.id) AS images
    FROM    products 
    LEFT JOIN    products_images
    ON      products_images.product_id = products.id
    WHERE products.id =${req.params.id} AND products.product_user =${req.user.user.id}
    GROUP BY products.id`;
  //let sql = `SELECT *FROM products WHERE id =${req.params.id} AND product_user =${user[0].id}`
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

//add new product
router.post("/", (req, res) => {
  let product = {
    product_name: req.body.product_name,
    product_user: req.user.user.id,
    product_price: req.body.product_price,
    product_desc: req.body.product_desc,
    product_cat: req.body.product_cat,
  };
  let sql = "INSERT INTO products SET ?";
  let query = mysqlConnection.query(sql, product, (err, result) => {
    if (err)
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    return res.json({
      status_code: 201,
      status: true,
      login: true,
      data: { product_id: result.insertId },
    });
  });
});

//update specific product
router.put("/", (req, res) => {
  let product = {
    product_name: req.body.product_name,
    product_price: req.body.product_price,
    product_desc: req.body.product_desc,
    product_stock: req.body.product_stock,
    product_cat: req.body.product_cat,
  };

  let sql = `UPDATE products  SET ? WHERE id =${req.body.id} AND product_user =${req.user.user.id} `;
  let query = mysqlConnection.query(sql, product, (err, result) => {
    if (err)
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    return res.json({
      status_code: 201,
      status: true,
      login: true,
      data: product,
    });
  });
});

//delete specific product
router.delete("/:id", (req, res) => {
  let sql = `DELETE FROM products  WHERE id =${req.params.id} AND product_user =${req.user.user.id} `;
  let query = mysqlConnection.query(sql, (err, result) => {
    if (err)
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    return res.json({
      status_code: 201,
      status: true,
      login: true,
      data: { id: req.params.id },
    });
  });
});

//flip product stock status
router.put("/stock/:id", (req, res) => {
  let sql = `UPDATE products  SET product_stock = NOT product_stock WHERE id=${req.params.id} AND product_user =${req.user.user.id}`;
  let query = mysqlConnection.query(sql, (err, result) => {
    if (err)
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    return res.json({
      status_code: 201,
      status: true,
      login: true,
      data: { id: req.params.id },
    });
  });
});

//get all products of a specific catogory
router.get("/catogories/:cat", (req, res) => {
  let sql = `SELECT  products.* , GROUP_CONCAT(product_image ORDER BY products_images.id) AS images
    FROM    products 
    LEFT JOIN    products_images
    ON      products_images.product_id = products.id
    WHERE products.product_cat =${req.params.cat} AND products.product_user =${req.user.user.id}
    GROUP BY products.id`;
  // let sql = `SELECT *FROM products WHERE product_cat =${req.params.cat} AND product_user =${user[0].id}`
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

//get no of products under a catogory
router.get("/catogories/no/:cat", (req, res) => {
  let sql = `SELECT COUNT(*) AS count FROM products WHERE product_cat =${req.params.cat} AND product_user =${req.user.user.id}`;
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
      data: { products_count: results[0].count },
    });
  });
});

let storage = multer.diskStorage({
  destination: function (req, res, callback) {
    let dir = "../product-images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    callback(null, dir);
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + Date.now() + path.extname(file.originalname)
    );
  },
});

router.post("/imageupload/:pid", (req, res) => {
  let upload = multer({ storage: storage }).array("product_image", 6);
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.json({
        status_code: 500,
        status: false,
        error: { message: err },
      });
    }

    let arrayDb = [];
    req.files.map((file) => arrayDb.push([req.params.pid, file.filename]));
    let sql =
      "INSERT INTO products_images (product_id, product_image) VALUES ?";
    let query = mysqlConnection.query(sql, [arrayDb], (err, result) => {
      if (err)
        return res.json({
          status_code: 500,
          status: false,
          error: { message: err },
        });
    });
    return res.json({
      status_code: 200,
      status: true,
      login: true,
      data: { images: arrayDb },
    });
  });
});

/*const storage = new Storage({
  projectId: "shopwhats-66d59",
  keyFilename:
    "./services/shopwhats-66d59-firebase-adminsdk-w4l15-98dbb653ba.json",
});

// Create a bucket associated to Firebase storage bucket
const bucket = storage.bucket("gs://shopwhats-66d59.appspot.com");

// Initiating a memory storage engine to store files as Buffer objects
const uploader = multer({
  storage: multer.memoryStorage(),
});
*/
// Upload endpoint to send file to Firebase storage bucket
/*router.post(
  "/uploadimage",
  uploader.array("product_image", 6),
  async (req, res, next) => {
    try {
      if (req.files.length > 0) {
        const response = await UploadStorageFirebase(
          req.files,
          req.body.product_id
        );
        return res.status(200).send(response);
      }
    } catch (error) {
      console.log(error);
      res.status(400).send(`Error, could not upload file: ${error}`);
      return;
    }
  }
);

const UploadStorageFirebase = (files, product_id) => {
  let prom = new Promise((_resolve, _reject) => {
    let arrayFile = [];
    let arrayDb = [];
    if (!files) {
      _reject("Not file");
    }
    files.map((filez) => {
      let fileName = filez.originalname + Date.now();
      // Create new blob in the bucket referencing the file
      const blob = bucket.file(fileName);

      // Create writable stream and specifying file mimetype
      const blobWriter = blob.createWriteStream({
        metadata: {
          contentType: filez.mimetype,
        },
      });

      blobWriter.on("error", (error) => {
        _reject(error);
      });

      blobWriter.on("finish", () => {
        // Assembling public URL for accessing the file via HTTP
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
          bucket.name
        }/o/${encodeURI(blob.name)}?alt=media`;

        // Return the file name and its public URL
        arrayFile.push({
          fileName,
          fileLocation: publicUrl,
        });
        arrayDb.push([product_id, fileName]);
        if (arrayFile.length == files.length) {
          let sql =
            "INSERT INTO products_images (product_id, product_image) VALUES ?";
          let query = mysqlConnection.query(sql, [arrayDb], (err, result) => {
            if (err)
              return res
                .status(500)
                .json({ status: false, error: { message: err } });
            _resolve(arrayFile);
          });
        }
      });
      blobWriter.end(filez.buffer);
    });
  });
  return prom;
};*/

module.exports = router;
