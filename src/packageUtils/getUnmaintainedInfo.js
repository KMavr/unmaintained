import getPackageInfo from "./getPackageInfo.js";
import getGitHubTopics from "./getGitHubTopics.js";

async function getUnmaintainedInfo(packageName, repositoryUrl) {
    const data = await getPackageInfo(packageName);
    const lastPublished = new Date(data.time.modified);
    const now = new Date();
    const diffTime = Math.abs(now - lastPublished);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const unmaintainedYears = diffDays / 365;

    let isUnmaintained = unmaintainedYears > 1;
    if (repositoryUrl) {
        const topics = await getGitHubTopics(repositoryUrl);
        if (topics.includes('unmaintained') || topics.includes('unmaintained-dont-use')) {
            isUnmaintained = true;
        }
    }

    return {
        isUnmaintained,
        unmaintainedYears: isUnmaintained ? unmaintainedYears.toFixed(1) : null,
    };
}

export default getUnmaintainedInfo;
