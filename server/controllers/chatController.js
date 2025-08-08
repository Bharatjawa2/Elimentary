const Chat = require('../models/Chat');
const BalanceSheet = require('../models/BalanceSheet');
const Company = require('../models/Company');
const { chatWithAI } = require('../utils/geminiAI');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, CHAT_STATUS } = require('../config/constants');

// @desc    Create new chat session
// @route   POST /api/chat
// @access  Private
const createChat = async (req, res) => {
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
      message: SUCCESS_MESSAGES.CHAT_CREATED,
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
};

// @desc    Get all chat sessions for user
// @route   GET /api/chat
// @access  Private
const getChats = async (req, res) => {
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
};

// @desc    Get chat by ID with messages
// @route   GET /api/chat/:id
// @access  Private
const getChatById = async (req, res) => {
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
};

// @desc    Send message to AI
// @route   POST /api/chat/:id/message
// @access  Private
const sendMessage = async (req, res) => {
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

    // Get the updated chat with new messages
    const updatedChat = await Chat.findById(chatId)
      .populate('company', 'name')
      .populate('context.balanceSheets', 'financialYear extractedData analysis');

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.MESSAGE_SENT,
      data: {
        userMessage: updatedChat.messages[updatedChat.messages.length - 2],
        aiResponse: updatedChat.messages[updatedChat.messages.length - 1],
        chatTitle: updatedChat.title,
        chat: updatedChat
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
};

// @desc    Update chat settings
// @route   PUT /api/chat/:id/settings
// @access  Private
const updateChatSettings = async (req, res) => {
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
};

// @desc    Delete chat session
// @route   DELETE /api/chat/:id
// @access  Private
const deleteChat = async (req, res) => {
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
};

// @desc    Get chat summary
// @route   GET /api/chat/:id/summary
// @access  Private
const getChatSummary = async (req, res) => {
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
};

// @desc    Archive chat session
// @route   PUT /api/chat/:id/archive
// @access  Private
const archiveChat = async (req, res) => {
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

    chat.status = CHAT_STATUS.ARCHIVED;
    await chat.save();

    res.json({
      success: true,
      message: 'Chat session archived successfully',
      data: {
        chat: {
          id: chat._id,
          status: chat.status
        }
      }
    });
  } catch (error) {
    console.error('Archive chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive chat session',
      error: error.message
    });
  }
};

// @desc    Get chat analytics
// @route   GET /api/chat/analytics
// @access  Private
const getChatAnalytics = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    const query = { user: req.user._id };
    if (companyId) query.company = companyId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const analytics = await Chat.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ['$status', CHAT_STATUS.ACTIVE] }, 1, 0] }
          },
          archivedChats: {
            $sum: { $cond: [{ $eq: ['$status', CHAT_STATUS.ARCHIVED] }, 1, 0] }
          },
          totalMessages: { $sum: { $size: '$messages' } },
          avgMessagesPerChat: { $avg: { $size: '$messages' } }
        }
      }
    ]);

    const companyStats = await Chat.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          companyName: { $first: '$companyInfo.name' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        analytics: analytics[0] || {
          totalChats: 0,
          activeChats: 0,
          archivedChats: 0,
          totalMessages: 0,
          avgMessagesPerChat: 0
        },
        companyStats
      }
    });
  } catch (error) {
    console.error('Get chat analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat analytics',
      error: error.message
    });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  sendMessage,
  updateChatSettings,
  deleteChat,
  getChatSummary,
  archiveChat,
  getChatAnalytics
};
