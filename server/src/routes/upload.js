// apps/server/src/routes/upload.js
const express = require('express');
const router  = express.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { protect, adminOnly } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({ region: process.env.AWS_REGION });

// POST /api/upload/presign
router.post('/presign', protect, adminOnly, async (req, res, next) => {
  try {
    const { fileName, fileType, folder = 'products' } = req.body;
    const key = `${folder}/${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket:      process.env.AWS_S3_BUCKET,
      Key:         key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({
      success:   true,
      uploadUrl,
      publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    });
  } catch (err) { next(err); }
});

module.exports = router;
