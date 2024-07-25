async function getGitHubTopics(repositoryUrl) {
    try {
        const match = repositoryUrl.match(/github\.com\/([^/]+\/[^/]+)/);
        if (!match) return [];

        const repoPath = match[1];
        const response = await fetch(`https://api.github.com/repos/${repoPath}/topics`, {
            headers: {
                Accept: 'application/vnd.github.mercy-preview+json'
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.names;
    } catch (error) {
        console.error(`Error fetching GitHub topics for ${repositoryUrl}:`, error);
        return [];
    }
}

export default getGitHubTopics;
