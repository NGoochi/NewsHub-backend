
API Definitions:

Parameters:

apiKey  string (required)

Your API key

resultType  string

Define what kind of results of the search you would like to get.

Available values: `articles`, `uriWgtList`, `langAggr`, `timeAggr`, `sourceAggr`, `sourceExAggr`, `authorAggr`, `keywordAggr`, `locAggr`, `conceptAggr`, `conceptGraph`, `categoryAggr`, `dateMentionAggr`, `sentimentAggr`, `recentActivityArticles`

Default value: `articles`

articlesPage  integer

Determines the page of the results to return (starting from 1). Relevant when `resultType = articles`.

Default value: `1`

articlesCount  integer

Define how many articles (up to 100) will be returned. Relevant when `resultType = articles`.

Default value: `100`

articlesSortBy  string

Choose the criteria for sorting the news articles. `rel` (relevance to the query), `date` (publishing date), `sourceImportance` (manually curated score of source importance - high value, high importance), `sourceImportanceRank` (reverse of sourceImportance), `sourceAlexaGlobalRank` (global rank of the news source), `sourceAlexaCountryRank` (country rank of the news source), `socialScore` (total shares on social media), `facebookShares` (shares on Facebook only). Relevant when `resultType = articles`.

Available values: `date`, `rel`, `sourceImportance`, `sourceAlexaGlobalRank`, `sourceAlexaCountryRank`, `socialScore`, `facebookShares`

Default value: `date`

articlesSortByAsc  boolean

Should the results be ordered in ascending order or descending order (default). Relevant when `resultType = articles`.

Default value: `false`

articleBodyLen  integer

Set the size of the article body that'll be returned in the response. Use -1 for full article body.

Default value: `-1`

dataType  string | string[]

What data types should we search? news content (default, `news`), press releases (`pr`) or blogs (`blog`).

Available values: `news`, `pr`, `blog`

Default value: `news`

forceMaxDataTimeWindow  integer

If you want to make sure that you are making queries just on the last month of data (to ensure smallest use of tokens) and you don't want to specify the `dateStart` and `dateEnd` parameters, then you can specify the `forceMaxDataTimeWindow` parameter and set it to 31 or 7 (the only two valid values). It determines the maximum age of the returned content. Don't specify the parameter if you want to search also the data that is older than 7 or 31 days.

Available values: `7`, `31`

Filters:

query  object

Query object with one or more search conditions. The `query` object should match the [Advanced Query Language](https://github.com/EventRegistry/event-registry-python/wiki/Searching-for-articles#advanced-query-language) format. If you specify the `query` parameter, then other query parameters like `keyword`, `conceptUri`, `sourceUri`, etc. should not be specified.

keyword  string | string[]

Find articles that mention the specified keyword or a phrase. You can specify at most 60 keywords in a single search. If you specify multiple `keyword` parameters, then only articles that mention all of them will be returned, unless you specify `keywordOper` parameter and set it to `or`.

Example value: `Barack Obama`

conceptUri  string | string[]

Find articles that mention the concept with a concept uri. You can specify at most 50 concepts in a single search. If multiple `conceptUri` parameters are provided, then only articles that are about all specified concepts will be returned, unless you specify `conceptOper` parameter and set it to `or`. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggConcepts) to get concept URI value for a specified concept label.

Example value: `http://en.wikipedia.org/wiki/World_Health_Organization`

categoryUri  string | string[]

Find articles that are assigned to a particular category. You can specify at most 20 categories in a single search. If multiple `categoryUri` parameters are provided, then articles that are about any of the specified categories will be returned, unless you specify `categoryOper` parameter and set it to `and`. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggCategories) to get value for a specified category name.

Example value: `dmoz/Business/Accounting`

sourceUri  string | string[]

Find articles that have been published by a news source. If you specify multiple `sourceUri` parameters, then articles from any of the specified sources will be returned. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggSources) to get value for a source name.

Example value: `bbc.co.uk`

sourceLocationUri  string | string[]

Find articles that were published by news sources located at the given geographic location (city or country). If you specify multiple `sourceLocationUri` parameters, then articles from sources from any of the specified sources will be returned. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggLocations) to get value for a location name.

Example value: `http://en.wikipedia.org/wiki/Germany`

sourceGroupUri  string | string[]

Find articles that were published by news sources that are assigned to some predefined group of news sources. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggSourceGroups) to get value for a source group or find the uri.

Example value: `general/ERtop10`

authorUri  string | string[]

Find articles that were written by a particular author. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggAuthors) to get value for author uri based on the author name (and potentially source url).

Example value: `mark_mazzetti@nytimes.com`

locationUri  string | string[]

Find articles that describe something that occured at a particular location (based on the location mentioned in the dateline). Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggLocations) to get value for a location name. NOTE: If a location will not be specified in the dateline (immediate start of the article), the article will not be returned. Consider also using `conceptUri` to find articles that mention a particular location.

Example value: `http://en.wikipedia.org/wiki/United_States`

lang  string | string[]

Find articles in the specified language(s). If parameter is not set, articles in all languages will be included. You can specify at most 5 languages in a single search. Specify languages using their ISO3 language codes. The full list of languages and their ISO3 codes can be found on [this page](https://github.com/EventRegistry/event-registry-python/wiki/Supported-languages).

Example value: `eng`

dateStart  string

The starting date on or after the articles of interest were published. The date should be in the YYYY-MM-DD format.

Example value: `2018-01-03`

dateEnd  string

The last date on which the articles of interest were published. The date should be in the YYYY-MM-DD format.

Example value: `2018-01-10`

dateMentionStart  string

Find articles that explicitly mention a date that is equal or greater than `dateMentionStart`. The date should be in the YYYY-MM-DD format.

Example value: `2018-01-10`

dateMentionEnd  string

Find articles that explicitly mention a date that is lower or equal to `dateMentionEnd`. The date should be in the YYYY-MM-DD format.

Example value: `2018-01-10`

keywordLoc  string

What data should be used when searching using the keywords provided by `keywords` parameter.

Available values: `body`, `title`, `body,title`

Default value: `body`

keywordOper  string

If more keywords are provided with the `keyword` parameter, what should be the Boolean operator used. If `and` (default) then all of the specified keywords have to be present in the article; if `or` then an article will be returned if it mentions any of the provided keywords.

Available values: `and`, `or`

Default value: `and`

conceptOper  string

If more concepts are provided with the `conceptUri` parameter, what should be the Boolean operator used. If `and` (default) then all of the specified concepts have to be present in the article; if `or` then an article will be returned if it mentions any of the provided concepts.

Available values: `and`, `or`

Default value: `and`

categoryOper  string

If more categories are provided with the `categoryUri` parameter, what should be the Boolean operator used. If `and` then all of the specified categories have to be present in the article; if `or` then an article will be returned if it mentions any of the provided categories.

Available values: `and`, `or`

Default value: `or`

ignoreKeyword  string | string[]

Ignore articles that mention the specified keyword or phrase. You can specify at most 60 keywords in a single search. If you specify multiple `ignoreKeyword` parameters, then articles that mention any of these keywords will be ignored.

Example value: `Donald Trump`

ignoreConceptUri  string | string[]

Ignore articles that mention the concept with concept uri. You can specify at most 50 concepts in a single search. If you specify multiple `ignoreConceptUri` parameters then articles that mention any of them will be ignored. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggConcepts) to get value for a specified concept label.

Example value: `http://en.wikipedia.org/wiki/World_Health_Organization`

ignoreCategoryUri  string | string[]

Ignore articles that are assigned into a particular category. You can specify at most 20 categories in a single search. If you specify multiple `ignoreCategoryUri` parameters then articles that mention any of them will be ignored. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggCategories) to get value for a specified category name.

Example value: `dmoz/Business/Accounting`

ignoreSourceUri  string | string[]

Ignore articles that have been published by a news source. If you specify multiple `ignoreSourceUri` parameters, then articles from any of the specified sources will be ignored. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggSources) to get value for a source name.

Example value: `bbc.co.uk`

ignoreSourceLocationUri  string | string[]

Ignore articles that were published by news sources located at the given geographic location (city or country). If you specify multiple `ignoreSourceLocationUri` parameters, then articles from sources from any of the specified sources will be ignored. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggLocations) to get value for a location name.

Example value: `http://en.wikipedia.org/wiki/Olsberg,_Germany`

ignoreSourceGroupUri  string | string[]

Ignore articles that were published by news sources that are assigned to some predefined group of news sources. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggSourceGroups) to get value for a source group or find the uri.

Example value: `general/ERtop10`

ignoreLocationUri  string | string[]

Ignore articles that describe something that occured at a particular location (based on the location mentioned in the dateline). Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggLocations) to get value for a location name.

Example value: `http://en.wikipedia.org/wiki/United_States`

ignoreAuthorUri  string | string[]

Ignore articles that were written by a particular author. Check [autosuggest methods](https://newsapi.ai/documentation?tab=suggAuthors) to get value for author uri based on the author name (and potentially source url).

Example value: `mark_mazzetti@nytimes.com`

ignoreLang  string | string[]

Ignore articles in the specified language(s). You can specify at most 5 languages in a single search. Specify languages using their ISO3 language codes. The full list of languages and their ISO3 codes can be found on [this page](https://github.com/EventRegistry/event-registry-python/wiki/Supported-languages).

Example value: `deu`

ignoreKeywordLoc  string

What data should be used when searching using the keywords provided by ignoreKeywords parameter.

Available values: `body`, `title`, `body,title`

Default value: `body`

startSourceRankPercentile  integer

Starting [ranking percentile of the sources](https://github.com/EventRegistry/event-registry-python/wiki/Source-filtering#filtering-of-sources-based-on-their-ranking) to consider in the results (default: 0). Value should be in range 0-90 and divisible by 10.

Default value: `0`

endSourceRankPercentile  integer

Ending [ranking percentile of the sources](https://github.com/EventRegistry/event-registry-python/wiki/Source-filtering#filtering-of-sources-based-on-their-ranking) to consider in the results (default: 100). Value should be in range 10-100 and divisible by 10.

Default value: `100`

minSentiment  integer

The minimum value of the sentiment, the article should have. Valid value is any floating number between -1 (very negative) to 1 (very positive). 0 represents neutral sentiment. Note that setting the value will automatically reduce results to just English articles, since the sentiment can only be computed for English language.

maxSentiment  integer

The maximum value of the sentiment, the article should have. Valid value is any floating number between -1 (very negative) to 1 (very positive). 0 represents neutral sentiment. Note that setting the value will automatically reduce results to just English articles, since the sentiment can only be computed for English language.

isDuplicateFilter  string

Some articles can be duplicates of other articles. What should be done with them.

Available values: `skipDuplicates`, `keepOnlyDuplicates`, `keepAll`

Default value: `keepAll`

eventFilter  string

Some articles describe a known event and some don't. This filter allows you to filter the resulting articles based on this criteria.

Available values: `skipArticlesWithoutEvent`, `keepOnlyArticlesWithoutEvent`, `keepAll`

Default value: `keepAll`

Returned Details:

includeArticleTitle  boolean

Set this parameter to true to include the article title in the response.

Default value: `true`

includeArticleBasicInfo  boolean

Set this parameter to true to include the core article information in the response.

Default value: `true`

includeArticleBody  boolean

Set this parameter to true to include the article body in the response.

Default value: `true`

includeArticleEventUri  boolean

Set this parameter to true to include the uri of the event (to which the article belongs) in the response.

Default value: `true`

includeArticleSocialScore  boolean

Set this parameter to true to include the information about how many times the article was shared on different social media.

Default value: `false`

includeArticleSentiment  boolean

Set this parameter to true to include the article sentiment in the response (value will be non-null only for English articles).

Default value: `true`

includeArticleConcepts  boolean

Set this parameter to true to include the article concepts in the response.

Default value: `false`

includeArticleCategories  boolean

Set this parameter to true to include the article categories in the response.

Default value: `false`

includeArticleLocation  boolean

Set this parameter to true to include the article location in the response.

Default value: `false`

includeArticleImage  boolean

Set this parameter to true to include the article image in the response.

Default value: `true`

includeArticleAuthors  boolean

Set this parameter to true to include the article authors in the response.

Default value: `true`

includeArticleVideos  boolean

Set this parameter to true to include the article videos in the response.

Default value: `false`

includeArticleLinks  boolean

Set this parameter to true to include the article links in the response.

Default value: `false`

includeArticleExtractedDates  boolean

Set this parameter to true to include article extracted dates in the response.

Default value: `false`

includeArticleDuplicateList  boolean

Set this parameter to true to include the list of duplicate articles in the response.

Default value: `false`

includeArticleOriginalArticle  boolean

Set this parameter to true to include the original article in the response.

Default value: `false`

includeSourceTitle  boolean

Set this parameter to true to include the source title in the response.

Default value: `true`

includeSourceDescription  boolean

Set this parameter to true to include the source description in the response.

Default value: `false`

includeSourceLocation  boolean

Set this parameter to true to include the source location in the response.

Default value: `false`

includeSourceRanking  boolean

Set this parameter to true to include the source ranking in the response.

Default value: `false`

includeConceptLabel  boolean

Set this parameter to true to include the concept label in the response.

Default value: `true`

includeConceptImage  boolean

Set this parameter to true to include the concept image in the response.

Default value: `false`

includeConceptSynonyms  boolean

Set this parameter to true to include the concept synonyms in the response.

Default value: `false`

conceptLang  string

Define the language of the concept label.

Default value: `eng`

includeCategoryParentUri  boolean

Set this parameter to true to include category parent uri in the response.

Default value: `false`

includeLocationGeoLocation  boolean

Set to true to include the geo location (latitude, longitude) for items that are locations.

Default value: `false`

includeLocationPopulation  boolean

Set to true to include the population size of the location.

Default value: `false`

includeLocationGeoNamesId  boolean

Set to true to include the GeoNames id of the location.

Default value: `false`

includeLocationCountryArea  boolean

Set to true to include the are of the location in squared km.

Default value: `false`

includeLocationCountryContinent  boolean

Set to true to get the continent of the country for location objects.

Default value: `false`


Code examples:

Example 1:

Find articles (news articles and PR content) that mention the phrase 'Tesla Inc' and return 100 latest articles with full article body. Return only articles from sources from USA, Canada and UK. Exclude the paywalled sources. Limit the search to the last month only (using `forceMaxDataTimeWindow` parameter).

```typescript
const er = new EventRegistry({allowUseOfArchive: false});
const requestArticlesInfo = new RequestArticlesInfo({count: 100, sortBy: "date", sortByAsc: false});
const q1 = new QueryArticles({
    keyword: "Tesla Inc",
    sourceLocationUri: [
        "http://en.wikipedia.org/wiki/United_States",
        "http://en.wikipedia.org/wiki/Canada",
        "http://en.wikipedia.org/wiki/United_Kingdom",
    ],
    ignoreSourceGroupUri: "paywall/paywalled_sources",
});
q1.setRequestedResult(requestArticlesInfo);
er.execQuery(q1).then((response) => {
    console.info(response);
});
```

Example 2:

Find the English or German articles published in the last month by sources ranked among top 30% that mention the words 'Barack' and 'Obama', but not necessarily together as a phrase. The articles should also not mention 'Michelle' or 'Sasha'. The matching articles are sorted by source importance from best to worst ranked. Return the first 30 articles containing the list of mentioned concepts, article categories, image and article location.

```typescript
const er = new EventRegistry({allowUseOfArchive: false});
const articleInfo = new ArticleInfoFlags({ concepts: true, categories: true, location: true, image: true });
const returnInfo = new ReturnInfo({articleInfo});
const requestArticlesInfo = new RequestArticlesInfo({count: 30, sortBy: "sourceImportance", sortByAsc: false, returnInfo: returnInfo});
const q1 = new QueryArticles({
    keywords: ["Barack", "Obama"], ignoreKeywords: ["Michelle", "Sasha"],
    lang: ["eng", "deu"],
    startSourceRankPercentile: 0, endSourceRankPercentile: 30, dataType: ["news", "blog"]});
q1.setRequestedResult(requestArticlesInfo);
er.execQuery(q1).then((response) => {
    console.info(response);
});
```

Example 3:

Find articles that mention George Clooney that were written by sources located in Germany or Los Angeles.

```typescript
const er = new EventRegistry({allowUseOfArchive: false});
const requestArticlesInfo = new RequestArticlesInfo({count: 100, sortBy: "date", sortByAsc: false});
const q1 = new QueryArticles({
    conceptUri: "http://en.wikipedia.org/wiki/George_Clooney",
    sourceLocationUri: [
        "http://en.wikipedia.org/wiki/Germany",
        "http://en.wikipedia.org/wiki/Los_Angeles_County,_California",
    ],
});
q1.setRequestedResult(requestArticlesInfo);
er.execQuery(q1).then((response) => {
    console.info(response);
});
```

Example Output:

```
{
  "articles": {
    "results": [
      {
        "uri": "7546825937",
        "lang": "eng",
        "isDuplicate": false,
        "date": "2023-05-16",
        "time": "10:35:00",
        "dateTime": "2023-05-16T10:35:00Z",
        "dateTimePub": "2023-05-16T10:34:00Z",
        "dataType": "news",
        "sim": 0,
        "url": "https://www.rmol.co/20230516/22538-tesla-changed-a-deadline-for-investor-proposals-angering-activists/",
        "title": "Tesla Changed A Deadline For Investor Proposals, Angering Activists | RMOL",
        "body": "Tesla investors will have fewer opportunities to express discontent with management at the company's annual meeting, which is taking place Tuesday in Austin, Texas, (trimmed) ...",
        "source": {
          "uri": "rmol.co",
          "dataType": "news",
          "title": "rmol.co"
        },
        "authors": [],
        "concepts": [
          {
            "uri": "http://en.wikipedia.org/wiki/Tesla,_Inc.",
            "type": "org",
            "score": 5,
            "label": {
              "eng": "Tesla, Inc."
            }
          },
          {
            "uri": "http://en.wikipedia.org/wiki/Shareholder",
            "type": "wiki",
            "score": 4,
            "label": {
              "eng": "Shareholder"
            }
          },
          {
            "uri": "http://en.wikipedia.org/wiki/Automotive_industry",
            "type": "wiki",
            "score": 3,
            "label": {
              "eng": "Automotive industry"
            }
          },
          {
            "uri": "http://en.wikipedia.org/wiki/Austin,_Texas",
            "type": "loc",
            "score": 3,
            "label": {
              "eng": "Austin, Texas"
            },
            "location": {
              "type": "place",
              "label": {
                "eng": "Austin, Texas"
              },
              "country": {
                "type": "country",
                "label": {
                  "eng": "United States"
                }
              }
            }
          },
          {
            "#META ITEM": "other concepts..."
          }
        ],
        "image": "https://www.rmol.co/wp-content/uploads/2023/05/16tesla-fckq-facebookJumbo-4859007.jpg",
        "eventUri": null,
        "shares": {},
        "sentiment": 0.01960784313725483,
        "wgt": 421929300,
        "relevance": 100
      },
      {
        "#META ITEM": "other articles..."
      }
    ],
    "totalResults": 38246,
    "page": 1,
    "count": 100,
    "pages": 383
  }
}
```

Output Schema:

```
{
  "type": "object",
  "properties": {
    "articles": {
      "type": "object",
      "properties": {
        "totalResults": {
          "type": "integer"
        },
        "page": {
          "type": "integer"
        },
        "count": {
          "type": "integer"
        },
        "pages": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri": {
                "type": "string"
              },
              "lang": {
                "type": "string"
              },
              "isDuplicate": {
                "type": "boolean"
              },
              "date": {
                "type": "string"
              },
              "time": {
                "type": "string"
              },
              "dateTime": {
                "type": "string"
              },
              "sim": {
                "type": "double"
              },
              "url": {
                "type": "string"
              },
              "title": {
                "type": "string"
              },
              "body": {
                "type": "string"
              },
              "source": {
                "type": "object",
                "properties": {
                  "uri": {
                    "type": "string"
                  },
                  "dataType": {
                    "type": "string"
                  },
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "location": {
                    "type": "object",
                    "properties": {
                      "type": {
                        "type": "string"
                      },
                      "label": {
                        "type": "object",
                        "properties": {
                          "eng": {
                            "type": "string"
                          }
                        }
                      }
                    }
                  },
                  "locationValidated": {
                    "type": "boolean"
                  },
                  "ranking": {
                    "type": "object",
                    "properties": {
                      "importanceRank": {
                        "type": "integer"
                      }
                    }
                  }
                }
              },
              "concepts": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "uri": {
                      "type": "string"
                    },
                    "type": {
                      "type": "string"
                    },
                    "score": {
                      "type": "integer"
                    },
                    "label": {
                      "type": "object",
                      "properties": {
                        "eng": {
                          "type": "string"
                        }
                      }
                    },
                    "image": {
                      "type": "string"
                    },
                    "synonyms": {
                      "type": "object",
                      "properties": {}
                    },
                    "trendingScore": {
                      "type": "object",
                      "properties": {
                        "news": {
                          "type": "object",
                          "properties": {
                            "score": {
                              "type": "double"
                            },
                            "testPopFq": {
                              "type": "integer"
                            },
                            "nullPopFq": {
                              "type": "integer"
                            }
                          }
                        }
                      }
                    },
                    "location": {
                      "type": "object",
                      "properties": {
                        "type": {
                          "type": "string"
                        },
                        "label": {
                          "type": "object",
                          "properties": {
                            "eng": {
                              "type": "string"
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              "categories": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "uri": {
                      "type": "string"
                    },
                    "label": {
                      "type": "string"
                    },
                    "wgt": {
                      "type": "integer"
                    }
                  }
                }
              },
              "links": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "videos": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "image": {
                "type": "string"
              },
              "duplicateList": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "originalArticle": {
                "type": "string"
              },
              "eventUri": {
                "type": "string"
              },
              "location": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string"
                  },
                  "label": {
                    "type": "object",
                    "properties": {
                      "eng": {
                        "type": "string"
                      }
                    }
                  }
                }
              },
              "extractedDates": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "amb": {
                      "type": "boolean"
                    },
                    "imp": {
                      "type": "boolean"
                    },
                    "date": {
                      "type": "string"
                    },
                    "textStart": {
                      "type": "integer"
                    },
                    "textEnd": {
                      "type": "integer"
                    }
                  }
                }
              },
              "shares": {
                "type": "object",
                "properties": {
                  "facebook": {
                    "type": "integer"
                  }
                }
              },
              "wgt": {
                "type": "integer"
              }
            }
          }
        }
      }
    },
    "uriWgtList": {
      "type": "object",
      "properties": {
        "totalResults": {
          "type": "integer"
        },
        "page": {
          "type": "integer"
        },
        "count": {
          "type": "integer"
        },
        "pages": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "conceptAggr": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "score": {
                "type": "integer"
              },
              "label": {
                "type": "object",
                "properties": {
                  "eng": {
                    "type": "string"
                  }
                }
              },
              "image": {
                "type": "string"
              },
              "synonyms": {
                "type": "object",
                "properties": {}
              },
              "trendingScore": {
                "type": "object",
                "properties": {
                  "news": {
                    "type": "object",
                    "properties": {
                      "score": {
                        "type": "double"
                      },
                      "testPopFq": {
                        "type": "integer"
                      },
                      "nullPopFq": {
                        "type": "integer"
                      }
                    }
                  }
                }
              },
              "location": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string"
                  },
                  "label": {
                    "type": "object",
                    "properties": {
                      "eng": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "keywordAggr": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "keyword": {
                "type": "string"
              },
              "weight": {
                "type": "double"
              }
            }
          }
        }
      }
    },
    "timeAggr": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "date": {
                "type": "string"
              },
              "count": {
                "type": "double"
              }
            }
          }
        }
      }
    },
    "sourceAggr": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri": {
                "type": "string"
              },
              "dataType": {
                "type": "string"
              },
              "title": {
                "type": "string"
              },
              "description": {
                "type": "string"
              },
              "location": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string"
                  },
                  "label": {
                    "type": "object",
                    "properties": {
                      "eng": {
                        "type": "string"
                      }
                    }
                  }
                }
              },
              "locationValidated": {
                "type": "boolean"
              },
              "ranking": {
                "type": "object",
                "properties": {
                  "importanceRank": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        }
      }
    },
    "conceptGraph": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "concepts": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "score": {
                "type": "integer"
              },
              "label": {
                "type": "object",
                "properties": {
                  "eng": {
                    "type": "string"
                  }
                }
              },
              "image": {
                "type": "string"
              },
              "synonyms": {
                "type": "object",
                "properties": {}
              },
              "trendingScore": {
                "type": "object",
                "properties": {
                  "news": {
                    "type": "object",
                    "properties": {
                      "score": {
                        "type": "double"
                      },
                      "testPopFq": {
                        "type": "integer"
                      },
                      "nullPopFq": {
                        "type": "integer"
                      }
                    }
                  }
                }
              },
              "location": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string"
                  },
                  "label": {
                    "type": "object",
                    "properties": {
                      "eng": {
                        "type": "string"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "links": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "uri1": {
                "type": "string"
              },
              "uri2": {
                "type": "string"
              },
              "score": {
                "type": "integer"
              }
            }
          }
        }
      }
    },
    "categoryAggr": {
      "type": "object",
      "properties": {
        "warning": {
          "type": "string"
        },
        "usedResults": {
          "type": "integer"
        },
        "totalResults": {
          "type": "integer"
        },
        "results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "label": {
                "type": "string",
                "example": "dmoz/Business/Investing/Stocks_and_Bonds"
              },
              "score": {
                "type": "double",
                "example": 0.123
              }
            }
          }
        }
      }
    },
    "recentActivityArticles": {
      "type": "object",
      "properties": {
        "currTime": {
          "type": "string"
        },
        "activity": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {}
          }
        }
      }
    }
  }
}
```