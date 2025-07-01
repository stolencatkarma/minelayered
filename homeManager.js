const fs = require('fs');
const path = require('path');
const { Vec3 } = require('vec3');

const homeFilePath = path.join(__dirname, 'home.json');

function saveHome(position) {
    try {
        fs.writeFileSync(homeFilePath, JSON.stringify(position.toJSON()));
        console.log(`Home position saved to ${homeFilePath}`);
    } catch (err) {
        console.error(`Failed to save home position: ${err}`);
    }
}

function loadHome() {
    try {
        if (fs.existsSync(homeFilePath)) {
            const data = fs.readFileSync(homeFilePath, 'utf8');
            const position = JSON.parse(data);
            console.log(`Home position loaded from ${homeFilePath}`);
            return new Vec3(position.x, position.y, position.z);
        }
    } catch (err) {
        console.error(`Failed to load home position: ${err}`);
    }
    return null;
}

module.exports = {
    saveHome,
    loadHome
};
