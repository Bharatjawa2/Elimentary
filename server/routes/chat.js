const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const BalanceSheet = require('../models/BalanceSheet');
const Company = require('../models/Company');
const { protect, authorizeCompanyAccess } = require('../middleware/auth');
const { chatWithAI } = require('../utils/geminiAI');

// @desc    Create new chat session
// @route   POST /api/chat
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { companyId, title, balanceSheetIds = [] } = req.body;

    // Validate company access
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user has access to this company
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== companyId && 
        req.user.parentCompany?.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    // Create new chat session
    const chat = new Chat({
      user: req.user._id,
      company: companyId,
      title: title || 'New Analysis Session',
      context: {
        balanceSheets: balanceSheetIds,
        analysisFocus: 'comprehensive'
      }
    });

    await chat.save();

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: {
        chat: {
          id: chat._id,
          title: chat.title,
          company: company.name,
          createdAt: chat.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat session',
      error: error.message
    });
  }
});

// @desc    Get all chat sessions for user
// @route   GET /api/chat
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, companyId } = req.query;

    const query = { user: req.user._id };
    if (companyId) {
      query.company = companyId;
    }

    const chats = await Chat.find(query)
      .populate('company', 'name')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      data: {
        chats,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat sessions',
      error: error.message
    });
  }
});

// @desc    Get chat by ID with messages
// @route   GET /api/chat/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('company', 'name')
      .populate('context.balanceSheets', 'financialYear extractedData');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user owns this chat
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat session'
      });
    }

    res.json({
      success: true,
      data: {
        chat
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat session',
      error: error.message
    });
  }
});

// @desc    Send message to AI
// @route   POST /api/chat/:id/message
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId)
      .populate('company', 'name')
      .populate('context.balanceSheets', 'financialYear extractedData analysis');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user owns this chat
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat session'
      });
    }

    // Add user message to chat
    await chat.addMessage('user', message);

    // Prepare context for AI
    const context = {
      companyInfo: chat.company.name,
      balanceSheetData: chat.context.balanceSheets.map(bs => ({
        year: bs.financialYear,
        data: bs.extractedData,
        analysis: bs.analysis
      }))
    };

    // Get AI response
    const aiResponse = await chatWithAI(message, context);

    // Add AI response to chat
    await chat.addMessage('assistant', aiResponse, {
      analysisType: 'general',
      confidence: 0.9
    });

    // Update chat title if it's the first message
    if (chat.messages.length === 2) {
      chat.title = chat.generateTitle();
      await chat.save();
    }

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        userMessage: chat.messages[chat.messages.length - 2],
        aiResponse: chat.messages[chat.messages.length - 1],
        chatTitle: chat.title
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// @desc    Update chat settings
// @route   PUT /api/chat/:id/settings
// @access  Private
router.put('/:id/settings', protect, async (req, res) => {
  try {
    const { title, settings, context } = req.body;
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user owns this chat
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat session'
      });
    }

    // Update fields
    if (title) chat.title = title;
    if (settings) chat.settings = { ...chat.settings, ...settings };
    if (context) chat.context = { ...chat.context, ...context };

    await chat.save();

    res.json({
      success: true,
      message: 'Chat settings updated successfully',
      data: {
        chat: {
          id: chat._id,
          title: chat.title,
          settings: chat.settings,
          context: chat.context
        }
      }
    });
  } catch (error) {
    console.error('Update chat settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat settings',
      error: error.message
    });
  }
});

// @desc    Delete chat session
// @route   DELETE /api/chat/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user owns this chat
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat session'
      });
    }

    await Chat.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat session',
      error: error.message
    });
  }
});

// @desc    Get chat summary
// @route   GET /api/chat/:id/summary
// @access  Private
router.get('/:id/summary', protect, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    // Check if user owns this chat
    if (chat.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat session'
      });
    }

    const summary = chat.getSummary();

    res.json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    console.error('Get chat summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat summary',
      error: error.message
    });
  }
});

module.exports = router;
