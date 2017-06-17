---
layout: post
title: "Debugging A Passive Aggressive Server 🤖"
comments: true
categories: tech epub-press debugging server
---

Since last year, I've been working on a project called [EpubPress](/projects/#epubpress). 

*(It's a 
[Chrome extension](https://chrome.google.com/webstore/detail/epubpress-read-the-web-of/pnhdnpnnffpijjbnhnipkehhibchdeok?hl=en),
[Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/epub-read-the-web-offline/),
[npm module](https://www.npmjs.com/package/epub-press-js) and 
[web service](https://epub.press) 
for creating ebooks from a collection of web articles.)*

EpubPress and I generally get along great. It serves my requests. It restores from errors. It does what's expected.

But all that being said, I'd noticed a persistent issue with EpubPress - **sometimes it would just stop talking to me** 😭.

> EpubPress! Give me the homepage!  
> \*crickets\* ... \*timeout\*

> EpubPress! Let me connect to you via SSH!  
> \*crickets\* ... \*timeout\*

> EpubPress! Respond to my pings!  
> \*crickets\* ... \*timeout\*

What was going on? It had just created a beautiful book for me a few hours ago? Why the cold shoulder?

Whenever this happened, I would go through the same steps:

1. **Is the server overloaded?** Nope. CPU usage was stable.
1. **Did the app need a restart?** Nope. App is running fine.
1. **Had Nginx failed?** Nope. Nginx was working normal.
1. **Did the logs for the instance have clues?** Nope. Nothing out of the usual.

By this point I'd be freaking out. My server uptime was losing 'nines' by the minute!

My last resort was to restart the machine - that put everything back to normal. Phew! 😌

...But only for so long.

By the next day, the issue would be happening again 😫.

## Enough is enough

Communication is important to me - so I was bothered that my cherished server wasn't using its words.

After multiple days of this happening in a row, I decided to get to the bottom of it.

### Talking to friends

When someone is giving you the silent treatment - sometimes you can find out why via a friend.

In this metaphor, my friend was [DownForEveryoneOrJustMe](http://downforeveryoneorjustme.com/epub.press).

> **Harold:** Hey DownForEveryoneOrJustMe, EpubPress is ignoring me. It talking to you?  
> **DownForEveryoneOrJustMe:** Just you!

Huh? That can't be true...  
I tried talking to EpubPress via another server.

> **Harold:** Hey HaroldTreen.com, is EpubPress talking to you these days?  
> **HaroldTreen.com:** It sure is! EpubPress is responding to all my texts.

What?! Betrayal! 🔥😡🔥

I now knew that...

- EpubPress was not responding to anything I sent it.
- It wasn't because EpubPress was busy. I checked and it was sitting idle at home.
- It wasn't because EpubPress was unwell. All the internal components were operational.
- It wasn't because EpubPress was anti-social. It was talking to everyone else.

I was stumped.

### Getting community help

At this point, I decided I needed more guidance. What else could cause my server to ignore me at random?

Luckily [I had attended a batch at the recurse center](/tech/recurse/2017/01/27/recurse-center-return-statement/) and had [a community of knowledgeable programmers](https://www.recurse.com/blog/112-how-rc-uses-zulip) who might be able to help.

![Zulip message](/assets/posts/timeout-debugging-zulip.jpg){: .center-image }

My pleas for help on Zulip.
{: .image-caption }

From there, I heard from @pirate and @imccoy who helped me do some better debugging™.

## Better debugging

My initial debugging strategies were pretty rudimentary.

- Restart nginx.
- Restart pm2.
- Make a request using Chrome.
- Make a request using `curl`.
- `grep` some log files.

Talking to people exposed to me to a whole set of awesome tools that helped get to the root of the issue.

### `netstat`

`netstat` (network statistics) is a command line tool for displaying information on network traffic. I used it to see all the ports my server was listening to. 

Using the `-p`, I was also able to see what processes were listening to each port. There was a normal number of connections and my app was listening to the right ports...

> Could it be a network issue?

### `mtr`

`mtr` (my traceroute) is a program that combines traceroute and ping. It continually pings the provided host and shows a live view of the path taken to deliver the ping.

Using `mtr`, I was able to see how packets sent to EpubPress were travelling. I noticed packets were getting blocked somewhere down the line.

> Could it be a server in the middle ignoring me?

### `tcpdump`

`tcpdump` is a program that lets you inspect all the packets being sent and received by a machine. It was like peeking into EpubPress's brain and seeing every word received and how it was responding.

Using `tcpdump host <my-ip>` I discovered that my packets were arriving, but no packets were being returned. Not even the most atomic level of acknowledgement was happening 😥.

> Could it be a firewall issue?
	
### `netcat`

`netcat` is a programming for writing directly to a network connection.

Using `nc <host> <port>` I was able to attempt a direct conversation between my machines. This worked for other machines, but not my laptop. That was consistent with previous debugging.

> ...This has to be an intentional block...

### `iptables`

`iptables` is a tool for modifying tables of firewall rules. It can be used to define how individual packets should be treated.

Using `iptables -L` I was able to list all the rules in the tables. Sure enough! There it was:

```
chain sshguard (1 references)
target     prot opt source               destination
DROP       all  --  <my-ip>              anywhere
```

The `sshguard` chain had a rule for blocking all my requests!

> Who is this sshguard character?!

### `sshguard`

`sshguard` is a tool for protecting against brute force attacks. It aggregates and inspects system logs to detects suspicious activity.

In other words, EpubPress had this friend `sshguard` who I didn't know existed. This friend had noticed us talking a lot and decided to brainwash EpubPress into ignoring me... for it's own safety. 

## Issue Solved 🎉

I had a talk with `sshguard`, settled our differences and had it add me to its whitelist. Now whenever I to talk to EpubPress, `sshguard` doesn't try to interfere.

## The moral of the story?

- There's cool tools out there for protecting against brute force attacks!
- Sometimes problems arise without warning and it's confusing - but there's always a reason!
- Reach out to others when you're facing an issue - they might have a wider array of tools to help debug the problem.

EpubPress and I resolved our differences and we are looking forward to making more beautiful ebooks together. 

**The End**
{: .center }

👨❤️🤖
{: .center }

*Thanks to \<people\> for helping me debug this blog post ❤️.*





