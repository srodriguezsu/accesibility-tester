// Helper to map audits into pass/fail
import axios from "axios";
const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const API_KEY = process.env.PSI_API_KEY;

export const getStatus = (audits, id) => {
    if (!audits[id]) return "N/A";
    return audits[id].score === 1 ? "Cumple" : "No Cumple";
};

export const getMultipleStatus = (audits, ids) => {
    let passed = 0;
    let failed = 0;

    ids.forEach(id => {
        if (audits[id]) {
            console.log("Checking audit:", id, "Score:", audits[id].score);
            if (audits[id].score === 1) passed++;
            if (audits[id].score !== 1) failed++;
        }
    });
    console.log(`Total Passed: ${passed}, Total Failed: ${failed}, Total Checked: ${ids.length}`);
    if (passed === 0 && failed === 0) return "N/A";

    if (passed > ids.length/2) return "Cumple";
    else return "No Cumple";
}

export const getLighthouse = async (domain) => {
    const { data } = await axios.get(PSI_API, {
        params: {
            url: domain,
            category: "ACCESSIBILITY",
            locale: "es",
            key: API_KEY
        }
    });
    return data.lighthouseResult;
}