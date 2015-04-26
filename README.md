# trakless
Less is more.  Trakless, similar to snowplow, is a client-side scripting engine that aim to provide simple analytic tracking through the use of a pixel.

Trakless is not a full blown analytic.  We have no plan, in this project, to supporting anything outside of a pixel, which has limitation of 2048 characters length on older IE.  If you need more than the basic, we recommend using snowplow, clicky, segmentio, or some other analytics.

# API
## trackless#setSiteId(siteId)
trakless require that you must have a numerical siteId for site segmentation

## trackless#setPixel(pixelUrl)
Unless you are testing, you should also set to your pixel URL on either Amazon CloudFront/S3/MaxCDN.

## trakless#getDefaultTracker
get default tracker

## trakless#getTracker(siteId, pixelUrl)
Trakless allow you to have multiple tracker, each with it's own pixel.

## trakless#track(hitType, dataObj)
hitType - a string determine the hit type
dataObj - the extra data to pass along with trakless

## trakless#pageview(context)
track page view, trakless automatically gather some basic data about the page
context - additonal context/parameter

## trakless#event(category, action, label, property, value)
track an event

That is all.  Trackless uses localStorage to store all it's tracking for data integrity and performance.

# backend pixel service
Pixel tracking is the most common tracking method.  Trakless require a backend web service that return a transparent pixels.

1. Simply host a pixel on your favorite web server, configure trakless for this pixel, and enable server-side request logging.  We recommend using nginx as it provide the best performance and logging.
2. Want more performance?  Use a service like MaxCDN.  The pixel origin can even come from our github repo: http://niiknow.github.io/pixel.gif

# log processing
We recommend that you store all your log on a daily basis into Amazon s3 and setup auto-backup to Amazon Glacier for dirt cheap.

1. If you use MaxCDN, you can query their API directly for analytic.
2. Parse your log with logstash and elastic search.  Kibana can be use as your engine for analytic.  You can scale out by having multiple elastic search servers.
3. Import the log into your favorite SQL engine for analytic.

# side project/repository/goals (coming soon...)
1. trakless plugin for extra data and automatic data collection
2. Android Tracking SDK
3. iOS Tracking SDK
4. A docker setup of nginx with tracking pixel and logging.
5. A set of script that can auto create your EC2 environment and automatically backup your data to s3.
