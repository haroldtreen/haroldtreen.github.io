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

EpubPress and I generally get along great. 

It serves my requests. It restores from errors. It does what's expected.

But all that being said, I'd noticed a persistent issue with EpubPress - **sometimes it would just stop talking to me** 😭.

> EpubPress! Give me the homepage!  
> \*crickets\* ... \*timeout\*

> EpubPress! Let me connect to you via SSH!  
> \*crickets\* ... \*timeout\*

> EpubPress! Respond to my pings!  
> \*crickets\* ... \*timeout\*

What was going on? It had just created a beautiful book for me an hour ago! Why the cold shoulder?

Whenever this happened, I would go through the same steps:

1. **Is the server overloaded?** Nope. CPU usage was stable.
1. **Did the app need a restart?** Nope. App is running fine.
1. **Had Nginx failed?** Nope. Nginx was working normal.
1. **Did the logs for the instance have clues?** Nope. Nothing out of the usual.

By this point I'd be freaking out. My server was losing 'nines' of uptime by the minute!

My last resort was to restart the machine - that put everything back to normal. Phew! 😌

...But only for so long.

By the next day, the issue would be happening again 😫.

## Enough is enough

Communication is important to me - so I was bothered that my cherished server wasn't using its words.

After multiple occurrences of this issue, I decided to get to the bottom of it.

### Talking to friends

When someone is giving you the silent treatment - sometimes you can find out why via a friend.

In this metaphor, my friend was [DownForEveryoneOrJustMe](http://downforeveryoneorjustme.com/epub.press).

> **Harold:** Hey DownForEveryoneOrJustMe, EpubPress is ignoring me. Is it talking to you?  
> **DownForEveryoneOrJustMe:** EpubPress is talking to me. Problem is only for you!

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

### Reaching out to others

At this point, I decided I needed more guidance. What else could cause my server to ignore me at random?

Luckily [I had attended a batch at the Recurse Center](/tech/recurse/2017/01/27/recurse-center-return-statement/) and had [a community of knowledgeable programmers](https://www.recurse.com/blog/112-how-rc-uses-zulip) who might be able to help.

![Zulip message](/assets/posts/timeout-debugging-zulip.jpg){: .center-image }

My pleas for help on Zulip.
{: .image-caption }

From there, I heard from @pirate and @imccoy who helped me do some better debugging™.

## Better debugging ™

My initial debugging strategies were pretty rudimentary.

- Restart `nginx`.
- Restart `pm2`.
- Make a request using Chrome.
- Make a request using `curl`.
- `grep` some log files.

Talking to others introduced to me to an awesome set of tools that helped get to the root of the issue.

### `netstat`

`netstat` (network statistics) is a command line tool for displaying information on network traffic. I used it to see all the ports my server was listening to. 

Using the `netstat -ap`, I was also able to see what processes were listening to each port. There was a normal number of connections and my app was listening to the right ports...

In the output you can see `nginx` and `pm2` connected and listening away:

```
Active UNIX domain sockets (servers and established)
Proto RefCnt Flags       Type       State         I-Node   PID/Program name
unix  3      [ ]         STREAM     CONNECTED     XXXXXX   31485/nginx -g daem 
unix  3      [ ]         STREAM     CONNECTED     XXXXXX   31485/nginx -g daem
unix  2      [ ACC ]     STREAM     LISTENING     XXXXX    1486/.pm2)
unix  2      [ ACC ]     STREAM     LISTENING     XXXXX    1486/.pm2)
```

> Maybe my packets aren't making it to the server?

### `mtr`

`mtr` (my traceroute) is a program that combines traceroute and ping. It continually pings the provided host and shows a live view of the path taken to deliver the ping.

Using `mtr <host>`, I was able to see how packets were travelling to EpubPress. I noticed packets were getting blocked somewhere down the line (all the `???`s). 

![MTR output](/assets/posts/timeout-debugging-mtr.jpg){: .center-image }

`mtr epub.press` output. At hop 13, packets are swallowed into the void.
{: .image-caption }

It's interesting to note that some intermediate servers were also returning `???`s. This could be because they are configured to forward traffic but ignore pings. That's fine, but my server is not one to ignore a friendly ping.

> Could it be a server in the middle ignoring me?

### `tcpdump`

`tcpdump` is a program that lets you inspect all the packets being sent and received by a machine. It was like peeking into EpubPress's brain and seeing every word received and how it was responding.

Using `tcpdump host <my-ip>` I discovered that my packets were arriving, but no packets were being returned. Not even a modest `SYN-ACK`s was being returned 😥.

This is what `tcpdump` produced on the server while my laptop was sending pings:

```
06:08:21.069515 IP pool-XXX-XX-XXX-XX.nycmny.fios.verizon.net > epubpress-backend.c.epubpress-XXXX.internal: ICMP echo request, id 10677, seq 33022, length 44
06:08:21.167963 IP pool-XXX-XX-XXX-XX.nycmny.fios.verizon.net > epubpress-backend.c.epubpress-XXXX.internal: ICMP echo request, id 10677, seq 33023, length 44
...etc
```

This is what working output looks like:

```
06:13:49.763522 IP pool-XXX-XX-XXX-XX.nycmny.fios.verizon.net > epubpress-backend.c.epubpress-XXXX.internal: ICMP echo request, id 10770, seq 33161, length 44
06:13:49.763556 IP epubpress-backend.c.epubpress-XXXX.internal > pool-XXX-XX-XXX-XX.nycmny.fios.verizon.net: ICMP echo reply, id 10770, seq 33161, length 44
```

`ping` uses a protocol called `ICMP` (Internet Control Message Protocol). No matter how many `ICMP echo` requests I sent, EpubPress would not reply.

> Could it be a firewall issue?
	
### `netcat`

`netcat` is a program for reading/writing directly to a network connection. I think of it like `cat`, but for printing whatever a given port receives. 

Using `nc <host> <port>` on both machines, I was able to test if a program separate from my application could communicate back to my laptop. As expected, this did not work - but I tried it anyway because it was fun using all these new tools. 

On working computers, I was able to type in the terminal and see the characters appear on the other end! Wow! 

> Teehee, I'm chatting with myself!  
> \*5 minutes later\*  
> Alright, enough tomfoolery! What is our firewall doing...

### `iptables`

`iptables` is a tool for modifying tables of firewall rules. It can be used to define how individual packets should be treated.

Using `iptables -L` I was able to list all the rules in the tables. Sure enough, there it was:

```
chain sshguard (1 references)
target     prot opt source               destination
DROP       all  --  <my-ip>              anywhere
```

The `sshguard` chain had a rule for blocking all my requests! 😱

> Who is this sshguard character?!

### `sshguard`

`sshguard` is a tool for protecting against brute force attacks. It aggregates and inspects system logs to detect suspicious activity. It then blocks the suspicious traffic.

In other words, EpubPress had this friend `sshguard` who I didn't know existed. `sshguard` had noticed me constantly talking to EpubPress and become worried whether this was a good use of EpubPress's time. 

So `sshguard` decided to brainwash EpubPress into ignoring me so it could focus on creating books.

## Issue Solved 🎉

I had a talk with `sshguard`, settled our differences and had it add me to its whitelist. 

```
sshguard -w <my-ip>
```

Now whenever I to talk to EpubPress, `sshguard` doesn't try to interfere.

## The moral of the story?

- Smart tools exist for protecting against brute force attacks!
- Sometimes strange problems arise and it makes no sense what's going on - but if you dig deep enough you'll likely find a fascinating explanation!
- Reach out to others when you're facing an issue - they might have a wider array of tools to help debug the problem.

EpubPress and I resolved our differences and we are looking forward to making more beautiful ebooks together. 

**The End**
{: .center }

👨❤️🤖
{: .center }

*Thanks to @jvns and @vaibhavsagar for helping me debug this blog post 💕.*





