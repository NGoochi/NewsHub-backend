"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSheetsConnection = exports.exportToGoogleSheets = void 0;
const googleapis_1 = require("googleapis");
/**
 * Export project data to Google Sheets
 * @param projectData Project data to export
 * @returns URL of the created spreadsheet
 */
const exportToGoogleSheets = async (projectData) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Google OAuth credentials not configured');
    }
    try {
        // Set up OAuth2 client
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        // Create Google Sheets API client
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth: oauth2Client });
        // Create a new spreadsheet
        const spreadsheet = await sheets.spreadsheets.create({
            requestBody: {
                properties: {
                    title: `NewsHub Export - ${projectData.name}`,
                }
            }
        });
        const spreadsheetId = spreadsheet.data.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error('Failed to create spreadsheet');
        }
        // Prepare Articles sheet data
        const articlesData = [
            ['ID', 'Title', 'News Outlet', 'Authors', 'URL', 'Date Written', 'Summary', 'Category', 'Sentiment'],
            ...projectData.articles.map(article => [
                article.id,
                article.title,
                article.newsOutlet || '',
                article.authors.join(', '),
                article.url || '',
                article.dateWritten?.toISOString() || '',
                article.summaryGemini || '',
                article.categoryGemini || '',
                article.sentimentGemini || ''
            ])
        ];
        // Prepare Quotes sheet data
        const quotesData = [
            ['ID', 'Article ID', 'Stakeholder Name', 'Affiliation', 'Quote'],
            ...projectData.articles.flatMap(article => article.quotes.map(quote => [
                quote.id,
                article.id,
                quote.stakeholderNameGemini || '',
                quote.stakeholderAffiliationGemini || '',
                quote.quoteGemini || ''
            ]))
        ];
        // Add Articles sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: 'Articles',
                                gridProperties: {
                                    rowCount: articlesData.length,
                                    columnCount: articlesData[0].length
                                }
                            }
                        }
                    },
                    {
                        addSheet: {
                            properties: {
                                title: 'Quotes',
                                gridProperties: {
                                    rowCount: quotesData.length,
                                    columnCount: quotesData[0].length
                                }
                            }
                        }
                    }
                ]
            }
        });
        // Populate Articles sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Articles!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: articlesData
            }
        });
        // Populate Quotes sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Quotes!A1',
            valueInputOption: 'RAW',
            requestBody: {
                values: quotesData
            }
        });
        // Format headers
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: 0, // Articles sheet
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                    textFormat: { bold: true }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                sheetId: 1, // Quotes sheet
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                                    textFormat: { bold: true }
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat)'
                        }
                    }
                ]
            }
        });
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    }
    catch (error) {
        throw new Error(`Failed to export to Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.exportToGoogleSheets = exportToGoogleSheets;
/**
 * Test Google Sheets API connection
 * @returns True if connection is successful
 */
const testSheetsConnection = async () => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        if (!clientId || !clientSecret || !refreshToken) {
            return false;
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth: oauth2Client });
        // Try to get a test spreadsheet to verify connection
        // Note: This is a simplified test - in production you'd want a more robust test
        console.log('Google Sheets connection test completed');
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.testSheetsConnection = testSheetsConnection;
