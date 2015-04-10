# trakless
Less is more.  The focus of trakless is to provide anybody the capability to simply tracking anything and perform custom analytic.  This is because using free analytic service can give away a lot of privacy, even though you can track a lot more.  

Inspired by Piwik, trakless was created as an open-source, high-performance analytic tracker.  Piwik is a very nice open-source analytic engine, but it suffer from performance and scalability issues.  Trakless single purpose is to provide high-performance pixel tracking.  See recommendation below for options on high-performance and scalable backend server/service/provider.

# backend pixel service
Pixel tracking is the most common tracking method.  Trakless require a backend web service that return transparent pixels.

1. Simply host a pixel on your favorite web server, configure trakless for this pixel, and enable server-side request logging.  We recommend using nginx as it provide the best performance and logging.
2. Want more performance?  Use a service like MaxCDN.  The pixel origin can even come from our github repo: http://niiknow.github.io/pixel.gif

# log processing
We recommend that you store all your log on a daily basis into Amazon s3 and setup auto-backup to Amazon Glacier for dirt cheap.

1. If you use MaxCDN, you can query their API directly for analytic.  The next goal of this project is to provide a front-end integration to MaxCDN API for analytic.
2. Parse your log with logstash and elastic search.  Kibana can be use as your engine for analytic.  You can scale out by having multiple elastic search servers.
3. Import the log into your favorite SQL engine for analytic.

# side project/repository/goals (coming soon...)
1. A MaxCDN analytic reporting front-end.
2. Android Tracking SDK
3. iOS Tracking SDK
4. A docker setup of nginx with tracking pixel and logging.
5. A set of script that can auto create your EC2 environment and automatically backup your data to s3.
