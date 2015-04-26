# trakless
Less is more.  Trakless, similar to snowplow, is a client-side scripting engine that aim to provide simple analytic tracking through the use of a pixel.

Trakless is not a full blown analytic.  We have no plan, in this project, to supporting anything outside of a pixel, which has limitation of 2048 characters length on older IE.  If you need more than the basic, we recommend using snowplow, clicky, segmentio, or some other analytics.

# API
## trakless/_tk
These are the two global objects available.  _tk is a short-cut so you don't have to worry about misspelling trakless vs trackless.

## _tk#setSiteId(siteId)
trakless require that you must have a numerical siteId for site segmentation

## _tk#setPixel(pixelUrl)
Unless you are testing, you should also set to your pixel URL on either Amazon CloudFront/S3/MaxCDN.

## _tk#getDefaultTracker
get default tracker

## _tk#getTracker(siteId, pixelUrl)
Trakless allow you to have multiple tracker, each with it's own pixel.

## _tk#track(hitType, context)
hitType - a string determine the hit/tracking type
context - the extra data to pass along with trakless

## _tk#pageview(context)
track page view, trakless automatically gather some basic data about the page
context - additonal context/parameter

## _tk#event(category, action, label, property, value)
track an event

That is all.  Trackless uses localStorage to store all it's tracking for data integrity and performance.

# Extensibility
Out of the box, trackless provide basic/core tracking functions (event, pageview, or track anything) defined in this google analytic document: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters

## Tracking Type/Schema/Hit Type
trakless.track method allow you to provide custom tracking type.  This is also known as *schema* or *hit type*.  Example:

```
  trakless.track('register', { firstname: '', lastname: '', address: '', city: '', state: '', country: '', subemail: 1, subsms: 1 });

  trakless.track('cart-item', {orderid: 123, sku: '', name: '', category: '', brand: '', price: '', quantity: '' });

  // you decide, maybe shopping list item only differ by orderid or listid
  trakless.track('list-item', {listid: 234, sku: '', name: '', category: '', brand: '', price: '', quantity: '' });
```

You determine the schema.  

Note: In future relase, we may provide some common schema definition to help create a consistent backend reporting code.  It will most likely be a by-product of backend reporting.

## Plugin
To support plugin, trakless utilize event emitter component mixin @ https://github.com/component/emitter

To provide maximum flexibility, trackless emit two events: track and tracked.  

### on('track', fn(item))
item.ht - the hit type
item.ctx - the context object

One common way to write plugin is to intercept this event and change the context object.  This is how we intercept pageview in trakless and inject some pageview defaults as seen in example below.
```
# plugin example in coffeescript
trakless.on 'track', (item) ->
  if (item.ht is 'pageview')
    myDef = webanalyser.get()
    item.ctx = defaults(item.ctx, myDef) 
```

### on('tracked', fn(item))
This allow you to do things after an event has passed.  for now, we don't know how this would be useful but maybe closing an alert, perhap?

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
