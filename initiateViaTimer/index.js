const extractBlogUrl = require('../extract-url');

module.exports = async function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if (myTimer.isPastDue)
    {
        context.log('Blog scrapper is running late!');
    }
    
    context.log('Blog scrapper started! ', timeStamp);   
    // extractBlogUrl()
};