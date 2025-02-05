const {Router}=require('express')
const {loginuser, createShortUrl, redirectShortUrl, getanalyticsByAlias, getanalyticsByTopic, getAllAnalytics } = require('../controllers/usercontroller');

const { authMiddleware } = require('../middlewares/auth');

const router=Router();


router.post("/google",loginuser);
router.post("/shorten",authMiddleware,createShortUrl);
router.get("/shorten/:alias",redirectShortUrl);
router.get("/analytics/overall",getAllAnalytics);
router.get("/analytics/:alias",getanalyticsByAlias);
router.get("/analytics/topic/:topic",getanalyticsByTopic);

module.exports=router;