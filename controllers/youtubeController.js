const { YouTubeChannel, UserChannel } = require('../models');

/**
 * @swagger
 * /api/youtube/channels/my:
 *   get:
 *     summary: Lấy tất cả kênh user sở hữu và được chia sẻ
 *     description: Yêu cầu đăng nhập. Trả về cả kênh sở hữu và kênh được chia sẻ còn hiệu lực.
 *     tags: [YouTube Channel]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Danh sách kênh
 */
// Lấy tất cả kênh user sở hữu và được chia sẻ
const getMyChannels = async (req, res) => {
  try {
    const userId = req.currentUser.id;
    // Lấy tất cả liên kết kênh của user (bao gồm sở hữu và được chia sẻ)
    const links = await UserChannel.findAll({ where: { user_id: userId, is_active: true } });
    const ownedChannelIds = links.filter(link => link.is_owner).map(link => link.channel_db_id);
    const sharedChannelIds = links.filter(link => !link.is_owner).map(link => link.channel_db_id);
    const ownedChannels = ownedChannelIds.length > 0 ? await YouTubeChannel.findAll({ where: { id: ownedChannelIds } }) : [];
    const sharedChannels = sharedChannelIds.length > 0 ? await YouTubeChannel.findAll({ where: { id: sharedChannelIds } }) : [];
    res.json({
      success: true,
      ownedChannels,
      sharedChannels
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyChannels,
}; 