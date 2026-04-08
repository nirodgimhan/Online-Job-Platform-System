const Contact = require('../models/Contact');
const User = require('../models/User');
const { createNotification } = require('./notificationController'); // Import notification helper

// Submit a message (public)
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newMessage = new Contact({ name, email, subject, message });
    await newMessage.save();

    // Notify all admins about new contact message
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          'new_contact',
          'New Contact Message',
          `New message from ${name}: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`,
          '/admin/contact-messages'
        );
      }
    } catch (notifError) {
      console.error('Error sending contact notification:', notifError);
      // Do not fail the request if notification fails
    }

    res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all messages (admin only)
const getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const query = {};
    if (status && ['unread', 'read', 'replied'].includes(status)) query.status = status;

    const messages = await Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single message
const getMessageById = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark as read
const markAsRead = async (req, res) => {
  try {
    const message = await Contact.findByIdAndUpdate(req.params.id, { status: 'read', readAt: new Date() }, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark as replied
const markAsReplied = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const update = { status: 'replied', repliedAt: new Date() };
    if (adminNote) update.adminNote = adminNote;
    const message = await Contact.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { submitContact, getAllMessages, getMessageById, markAsRead, markAsReplied, deleteMessage };