import getPackageInfo from "./getPackageInfo.js";
import getGitHubTopics from "./getGitHubTopics.js";

async function getUnmaintainedInfo(packageName, repositoryUrl) {
    const data = await getPackageInfo(packageName);
    const lastPublished = data?.time?.modified ? new Date(data.time.modified) : null;

    let unmaintainedYears = 0;
    let isUnmaintained = false;

    if (lastPublished && !isNaN(lastPublished)) {
        const now = new Date();
        const diffTime = Math.abs(now - lastPublished);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        unmaintainedYears = diffDays / 365;

        // Mark as unmaintained if more than 1 year old
        isUnmaintained = unmaintainedYears > 1;
    }

    // Check repository topics for unmaintained flags
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
