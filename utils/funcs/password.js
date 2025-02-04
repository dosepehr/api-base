const bcrypt = require('bcrypt');

exports.comparePassword = async (plainPassword, hash) => {
    const match = await bcrypt.compare(plainPassword, hash);
    return match;
};

exports.hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
};
