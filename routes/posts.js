const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const requireAuth = require('../middleware/auth');
const Post = require('../models/Post');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'dprian-fanfest',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo ? ['mp4', 'mov', 'webm', 'm4v'] : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB por archivo
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!ok) return cb(new Error('Solo se permiten imágenes o videos'));
    cb(null, true);
  },
});

// GET /api/posts?event=&search=&from=&to=
router.get('/', async (req, res) => {
  try {
    const { event, search, from, to } = req.query;
    const query = {};

    if (event) query.event = event;
    if (from || to) {
      query.eventDate = {};
      if (from) query.eventDate.$gte = new Date(from);
      if (to) query.eventDate.$lte = new Date(to);
    }
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const posts = await Post.find(query).sort({ eventDate: -1, createdAt: -1 }).limit(300);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo las publicaciones', error: err.message });
  }
});

// GET /api/posts/events -> lista de eventos distintos, para llenar el filtro
router.get('/events', async (req, res) => {
  try {
    const events = await Post.distinct('event');
    res.json(events.sort());
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo eventos', error: err.message });
  }
});

// POST /api/posts (requiere sesión) -> subir una foto o video
router.post('/', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Error al subir el archivo' });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ningún archivo' });
      }
      const { caption, event, eventDate } = req.body;
      if (!event || !eventDate) {
        return res.status(400).json({ message: 'Indica el evento y la fecha' });
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      const post = await Post.create({
        uploader: req.userId,
        uploaderName: req.userName,
        type: isVideo ? 'video' : 'image',
        url: req.file.path,
        publicId: req.file.filename,
        caption: (caption || '').trim(),
        event: event.trim(),
        eventDate: new Date(eventDate),
      });

      res.status(201).json(post);
    } catch (innerErr) {
      res.status(500).json({ message: 'Error guardando la publicación', error: innerErr.message });
    }
  });
});

// DELETE /api/posts/:id (requiere sesión, solo el dueño puede borrar)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Esa publicación ya no existe' });

    if (post.uploader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Solo puedes borrar tus propias publicaciones' });
    }

    await cloudinary.uploader.destroy(post.publicId, {
      resource_type: post.type === 'video' ? 'video' : 'image',
    });
    await post.deleteOne();

    res.json({ message: 'Publicación eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error eliminando la publicación', error: err.message });
  }
});

module.exports = router;
