# trakless
Less is more.  Trakless, similar to snowplow, is a client-side scripting engine that aim to provide simple analytic tracking through the use of a pixel.

Trakless is simple.  You provide a pixel url and it will send all data to that url by query string.  This mean that you can simply setup an Amazon s3 bucket for static hosting your pixel and log that bucket request for future analytic. 

Trakless is not a full blown analytic.  We have no plan, in this project, to supporting anything outside of doing a GET pixel/URL, which has limitation of 2048 characters length on older IE.  If you need more than the basic, we recommend using snowplow, clicky, segmentio, or some other analytics.

# API
## trakless/_tk
These are the two global objects available, trackless and _tk.  _tk is a short-cut so you don't have to worry about misspelling trakless vs. trackless.

## _tk#setSiteId(siteId)
trakless support multitenancy out of the box which require a siteId integer for site segmentation.  This is accomplish by initializing trakless with _tk.setSiteId(siteId).  You can also provide site id through script reference.

```
<script src="url/to/trakless.min.js" data-siteid="777"></script>
```

## _tk#setPixel(pixelUrl)
Unless you are testing, you should set to your pixel URL to your own backend (S3/CloudFront/MaxCDN/etc..).  The default pixel for trakless is our gh-page for this repo (http://niiknow.github.io/trakless/pixel.gif).

## _tk#getDefaultTracker
Trakless allow your to send tracking to multiple pixel/trackers.  This method give you the default tracker.

## _tk#getTracker(siteId, pixelUrl)
Trakless allow you to have multiple trackers, each with it's own pixel.  This method get or create specific tracker for specified siteId and pixelUrl.

## _tk#track(hitType, context)
hitType - a string determine the hit/tracking type
context - the extra data to pass along with trakless

This method send event to all tracker/pixels.

## _tk#pageview(context)
track page view, trakless automatically gather some basic data about the page
context - additonal context/parameter

This method fire a pageview event.

## _tk#event(category, action, label, property, value)
This method is use to track an event.

That is all.  Trackless uses localStorage to store all it's tracking for data integrity and performance.

# Extensibility
Out of the box, trackless provide basic/core tracking functions (event, pageview, or track anything) defined in this google analytic document that can be found here: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters

## Tracking Type/Schema/Hit Type
_tk.track method allow you to provide custom tracking type.  This is also known as *schema* or *hit type*.  Example:

```
  _tk.track('register', { firstname: '', lastname: '', address: '', city: '', state: '', country: '', subemail: 1, subsms: 1 });

  _tk.track('cart-item', {orderid: 123, sku: '', name: '', category: '', brand: '', price: '', quantity: '' });

  // you decide, maybe shopping list item only differ by orderid or listid
  _tk.track('list-item', {listid: 234, sku: '', name: '', category: '', brand: '', price: '', quantity: '' });
```

You determine the schemas for the different hit types.

Note: In future release, we may provide some common schema definition to help create a consistent backend reporting.
## Plugin
To support plugin, trakless utilize event emitter component mixin @ https://github.com/component/emitter

To provide maximum flexibility, trackless emit two events: 'track' and 'tracked'.  You can wire into these events enhance data collection or to trigger your own event.  Example below:

### on('track', fn(item))
item.ht - the hit type
item.ctx - the context object (additional data to pass into piel querystring)

Example below intercept this event and change the context object.  This is how trakless, internally, intercept pageview and inject some pageview defaults.

```
# plugin example in coffeescript
_tk.on 'track', (item) ->
  if (item.ht is 'pageview')
    myDef = webanalyser.get()
    item.ctx = defaults(item.ctx, myDef) 
```

### on('tracked', fn(item))
This allow you to do things after an event has passed.  For now, we don't know how this would be useful but maybe closing an alert, perhap?

With some creativity, combine 'track' method and on 'track' event should give you the full flexibility of writing any kind of plugin you desired.

Example:
```
  // use jquery to live detect all anchor click
  $(document.body).on('click', 'a', function(evt){
    el = evt.target;
    _tk.track('link', {el: el, href: el.href, id: el.id, cls: el.className, target: el.target});
  });
```

As seen above, you can pass a dom object into the context method.  As a default, trackless will just ignore it but you later intercept the 'track' event as follow:

```
  _tk.on('track', function(item){
    if (item.ht != 'link') return;
    
    if (item.el) {
      item.content = $(item.el).html();
      item.value = $(item.el).val();
    }
  });
```

The example above show that you can intercept any plugin and provide additional context for tracking.

# backend pixel service
Pixel tracking is the most common tracking method.  Trakless require a backend web service that return a transparent pixels.

1. Simply host a pixel on your favorite web server, configure trakless for this pixel, and enable server-side request logging.  We recommend using s3 bucket with logging or nginx as it provide the best performance and logging.
2. Want more performance?  Use a service like MaxCDN.

# log processing
We recommend that you store all your log on a daily basis into Amazon s3 and setup auto-backup to Amazon Glacier for dirt cheap.

1. If you use MaxCDN, you can query their API directly for analytic.
2. Parse your log with logstash and elastic search.  Kibana can be use as your engine for analytic.  You can scale out by having multiple elastic search servers.
3. Alternatively, you can import the log into your favorite SQL engine or AWS redshift analytic.

# side project/repository/goals (coming soon...)
1. trakless tag management through github - dynamically load tag by referencing some remote github repository
2. Android Tracking SDK
3. iOS Tracking SDK
