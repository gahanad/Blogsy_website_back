const extractHashtags = (text) => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const hashtagRegex = /#(\w+)/g; 
    const matches = text.match(hashtagRegex);

    if (!matches) {
        return [];
    }

    const hashtags = matches.map(tag => tag.substring(1).toLowerCase());

    return [...new Set(hashtags)];
};

module.exports = {
    extractHashtags,
};