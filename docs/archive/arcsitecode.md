<!DOCTYPE html>
<html lang="en">

<head>
    <title>ARC Prize - Play the Game</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Easy for humans, hard for AI. Try ARC-AGI." />
	<meta property="og:title" content="ARC Prize - Play the Game" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:type" content="article" />
	<meta property="og:description" content="Easy for humans, hard for AI. Try ARC-AGI." />
	<meta property="og:url" content="https://arcprize.org/play" />
	<meta property="og:site_name" content="ARC Prize" />
	<meta property="og:image" content="https://arcprize.org/media/images/og-image-default.jpg" />
	<meta name="twitter:site" content="@ARCprize" />
	<meta name="twitter:card" content="summary" />
	<meta property="twitter:title" content="ARC Prize - Play the Game" />
	<meta property="twitter:description" content="Easy for humans, hard for AI. Try ARC-AGI." />
	<meta property="twitter:image" content="https://arcprize.org/media/images/og-image-default.jpg" />
	
    <link rel="icon" type="image/x-icon" href="/media/images/favicon.png">
    <link rel="stylesheet" href="/media/css/style.css?v=3">
    
    <link rel="stylesheet" type="text/css" href="/media/css/playground.css">
    
    <script src="/media/js/script.js"></script>
    
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-KVYLYJJF4D"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-KVYLYJJF4D');
    </script>
    
</head>

<body>
    
    <header>
    <div>
        <a href="/" class="logo-link">
            <div class="logo"></div>
        </a>
        <div class="tagline gradient-text">AGI remains unsolved.<br />New ideas still needed.</div>
    </div>
    <div class="mobile-menu">
        <input class="mm-btn" type="checkbox" id="mm-btn" name="mm-btn">
        <label class="mm-icon" for="mm-btn">
            <span class="navicon" aria-label="menu 'icon'">
        </label>
        <div class="mm-overlay">
            <nav class="menu-container">
    <div class="menu-column">
        <h4>Foundation</h4>
        <ul>
            <li><a href="/about">Mission</a></li>
            <li><a href="/jobs">Jobs</a></li>
            <li><a href="/donate" class="primary">Donate</a></li>
        </ul>
    </div>

    <div class="menu-column">
        <h4>Benchmark</h4>
        <ul>
            <li><a href="/arc-agi">ARC-AGI</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="/play" class="active">Play</a></li>
        </ul>
    </div>

    <div class="menu-column">
        <h4>Prize</h4>
        <ul>
            <li><a href="/competitions">Competitions</a></li>
            <li><a href="/guide">Guide</a></li>
            <li><a href="#" class="modal-btn primary" data-modal-id="signup">Get Started</a></li>           
            <!-- <li><a href="/policy">Testing</a></li>
            <li><a href="/partners">Partners</a></li> -->
        </ul>
    </div>

    <div class="menu-column">
        <h4>Community</h4>
        <ul>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/resources">Resources</a></li>
        </ul>
    </div>
</nav>
        </div>
    </div>
    <nav class="menu-container">
    <div class="menu-column">
        <h4>Foundation</h4>
        <ul>
            <li><a href="/about">Mission</a></li>
            <li><a href="/jobs">Jobs</a></li>
            <li><a href="/donate" class="primary">Donate</a></li>
        </ul>
    </div>

    <div class="menu-column">
        <h4>Benchmark</h4>
        <ul>
            <li><a href="/arc-agi">ARC-AGI</a></li>
            <li><a href="/leaderboard">Leaderboard</a></li>
            <li><a href="/play" class="active">Play</a></li>
        </ul>
    </div>

    <div class="menu-column">
        <h4>Prize</h4>
        <ul>
            <li><a href="/competitions">Competitions</a></li>
            <li><a href="/guide">Guide</a></li>
            <li><a href="#" class="modal-btn primary" data-modal-id="signup">Get Started</a></li>           
            <!-- <li><a href="/policy">Testing</a></li>
            <li><a href="/partners">Partners</a></li> -->
        </ul>
    </div>

    <div class="menu-column">
        <h4>Community</h4>
        <ul>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/resources">Resources</a></li>
        </ul>
    </div>
</nav>
</header>
    <div class="container">
    <div class="item bg-rainbow center" style="padding-top: 24px;padding-bottom: 24px;">
        <p><a href="/arc-agi/3">ARC-AGI-3 Preview</a> is now live. Play the <a href="https://three.arcprize.org/">first six games here</a>!</p>
    </div>
</div>
<div class="game-full">
    <div style="margin-bottom: 20px;">
        <h3 id="play_arc">Play</h3>
        <p>Try ARC-AGI-1 and 2: Given the examples, identify the pattern, solve the test puzzle.</p>
    </div>
    <div id="load_task_control_btns" class="load_task_control_btns controls hide">
        <div id="task_name" style="display: inline-block;"></div>
        <div id="task_nav" class="task-nav">
            <button onclick="previousTask()" id="serial_prev_task_btn" class="prev_next_btn">
                Previous
            </button>
            <div id="task_order" style="display: inline-block;"></div>
            <button onclick="nextTask()" id="serial_next_task_btn" class="prev_next_btn">
                Next
            </button>
        </div>
        <div class="task-nav">
            <select name="set" id="set">
                <option value="daily_puzzle">Daily Puzzle</option>
                <option value="v1_public_evaluation_set">Public Evaluation v1 Set (Hard)</option>
                <option value="v1_public_training_set">Public Training Set v1 (Easy)</option>
                <option value="v2_public_evaluation_set">Public Evaluation Set v2 (Hard)</option>
                <option value="v2_public_training_set">Public Training Set v2 (Easy)</option>
            </select>
        </div>
    </div>
    <div id="daily-puzzle-stats" class="hide"></div>
    <div class="game">
        <div class="game-column">
            <div class="header-row">
                <h4 class="ntm">Examples</h4>
                <div class="text">Scroll 👉</div>
            </div>
            <div id="task_train"></div>
        </div>
        <div class="game-column">
            <div class="header-row">
                <h4 class="ntm">Test</h4>
                <div class="text">Scroll 👉</div>
            </div>
            <div id="task_test"></div>
            <div>
                <div class="controls" id="test-controls">
                    <button onclick="previousTestInput()">Previous</button>
                    <div style="display:inline-block;">Test <span id="current_test_input_id_display">1</span> of <span
                            id="total_test_input_count_display">1</span></div>
                    <button onclick="nextTestInput()">Next</button>
                </div>
                <div class="controls">
                    <div style="margin-bottom:10px;">1. Configure your output grid:
                    </div>
                    <div style="display: inline-block;">
                        <input type="text" id="output_grid_size" class="grid_size_field" name="size" value="3x3">
                        <button onclick="resizeOutputGrid()" id="resize_btn">
                            Resize
                        </button>
                    </div>
                    <div class="grid-actions">
                        <button onclick="copyFromInput()">
                            Copy from input
                        </button>
                        <button onclick="clearOutputGrid()">
                            Clear
                        </button>
                        <button onclick="resetOutputGrid()">
                            Reset
                        </button>
                    </div>
                </div>
                <div class="controls">
                    <div style="margin-bottom:10px;">2. Edit your output grid cells:</div>
                    <div id="toolbar">
                        <input type="radio" id="tool_edit" name="tool_switching" value="edit" checked="">
                        <label for="tool_edit"><span class="icon edit"></span> <span style="text-decoration: underline;">E</span>dit</label>
                        <input type="radio" id="tool_select" name="tool_switching" value="select">
                        <label for="tool_select"><span class="icon select"></span> <span style="text-decoration: underline;">S</span>elect</label>
                        <input type="radio" id="tool_floodfill" name="tool_switching" value="floodfill">
                        <label for="tool_floodfill"><span class="icon fill"></span> <span style="text-decoration: underline;">F</span>ill</label>
                    </div>
                    <div id="symbol_picker">
                        <div class="symbol_preview symbol_0" symbol="0"><span>0</span></div>
                        <div class="symbol_preview symbol_1" symbol="1"><span>1</span></div>
                        <div class="symbol_preview symbol_2" symbol="2"><span>2</span></div>
                        <div class="symbol_preview symbol_3" symbol="3"><span>3</span></div>
                        <div class="symbol_preview symbol_4" symbol="4"><span>4</span></div>
                        <div class="symbol_preview symbol_5" symbol="5"><span>5</span></div>
                        <div class="symbol_preview symbol_6 selected-symbol-preview" symbol="6"><span>6</span></div>
                        <div class="symbol_preview symbol_7" symbol="7"><span>7</span></div>
                        <div class="symbol_preview symbol_8" symbol="8"><span>8</span></div>
                        <div class="symbol_preview symbol_9" symbol="9"><span>9</span></div>
                    </div>
                </div>
                <div class="controls">
                    <div style="margin-bottom:10px;">3. See if your output is correct:</div>
                    <button onclick="submitSolution()" id="submit_solution_btn">
                        Submit solution
                    </button>
                    <div id="info_display" style="display: none;"></div>
                </div>
            </div>
        </div>
    </div>
    <div id="daily-puzzle" class="center hide" style="margin: 100px 0;">
        <h2 class="arcade crt" style="font-size:16px;position: relative;">Daily Puzzle!</h2>
        <div style="margin:40px 0;">
            <p>Today is <span id="current-date"></span>.</p>
            <p>Are you ready to try your luck at today's selected ARC-AGI task?</p>
        </div>
        <button id="daily-puzzle-start"
            style="padding: 10px 60px;background-color: var(--magenta);font-weight: bold;">Start</button>
    </div>
</div>
<div id="daily-puzzle-share" class="modal">
    <h3 style="margin-bottom: 25px;">Congratulations!</h3>
    <p>You've solved the ARC Prize Daily Puzzle. You are still more (generally) intelligent than AI.</p>
    <div id="results"
        style="margin:25px 0;border: 1px solid var(--gray);padding: 20px;background-color: rgba(255,255,255,0.1);">
        ARC-AGI Task: <span id="result-task-id"></span><br>
        Date: <span id="result-date"></span><br>
        Time: <span id="result-time"></span><br>
        Attempts: <span id="result-attempts"></span></div>
    <p>Share your results on social media!</p>
    <div style="margin: 15px 0 25px;"><button id="results-copy">Copy results</button> <span id="copy-success"></span></div>
    <p>New puzzle every day at 12pm UTC (5am Pacific / 8am Eastern).</p>
</div>
<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_lqT2v3bWtBEPhw0Qusu68YF4ECokQMQq9V3Ph0DIJ43',{api_host:'https://us.i.posthog.com', person_profiles: 'always'
        })
</script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js"></script>
<script src="/media/js/confetti.js"></script>
<script src="/scripts/get-daily-puzzle.js"></script>
<script src="/media/js/playground.js"></script>
    <footer>
    <div class="container">
        <div class="item">
            <div class="logo-container">
                <a href="/"><img src="/media/images/arc-prize-logo-secret.svg" class="logo"></a>
            </div>            
        </div>
        <div class="item">
            <ul>
                <li><a href="https://arcprize.kit.com/bc80575d89" class="modal-btn" data-modal-id="newsletter"><img src="/media/images/icon-email.svg"> <span>Newsletter</span></a></li>
                <li><a href="https://discord.gg/9b77dPAmcA" target="_blank"><img src="/media/images/icon-discord.svg"> <span>Discord</span></a></li>
                <li><a href="https://twitter.com/arcprize" target="_blank"><img src="/media/images/icon-x.svg"> <span>Twitter</span></a></li>
                <li><a href="https://www.youtube.com/channel/UC_rdrp-QkrZn-ce9uCE-0EA" target="_blank"><img src="/media/images/icon-youtube.svg"> <span>YouTube</span></a></li>
                <li><a href="https://github.com/arcprize/ARC-AGI-2" target="_blank"><img src="/media/images/icon-github.svg"><span>GitHub</span></a></li>
            </ul>
        </div>
    </div>
    <div class="container copyright">
        <div class="item copyright-text">
            <div>
                &copy; 2025 ARC Prize, Inc. <a href="/privacy">Privacy</a> <a href="/terms">Terms</a> <a href="/donate">Donate</a> <a href="/policy">Testing Policy</a>
            </div>
        </div>
        <div class="item copyright-tagline">
            A non-profit for the public advancement of open artificial general intelligence. All rights reserved.
        </div>
    </div>
</footer>
    <div id="modal-container">
    <div class="modal-content">
        <div class="close">
            <div class="navicon x"></div>
        </div>
        <div id="modal-dynamic"></div>
    </div>
</div>
<div id="signup" class="modal">
    <script src="https://f.convertkit.com/ckjs/ck.5.js"></script>
    <form action="https://app.convertkit.com/forms/6685080/subscriptions" class="seva-form formkit-form"
        method="post" data-sv-form="6685080" data-uid="bc80575d89" data-format="inline" data-version="5"
        data-options="{&quot;settings&quot;:{&quot;after_subscribe&quot;:{&quot;action&quot;:&quot;message&quot;,&quot;success_message&quot;:&quot;Success! Now check your email to confirm your subscription.&quot;,&quot;redirect_url&quot;:&quot;&quot;},&quot;analytics&quot;:{&quot;google&quot;:null,&quot;fathom&quot;:null,&quot;facebook&quot;:null,&quot;segment&quot;:null,&quot;pinterest&quot;:null,&quot;sparkloop&quot;:null,&quot;googletagmanager&quot;:null},&quot;modal&quot;:{&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;powered_by&quot;:{&quot;show&quot;:false,&quot;url&quot;:&quot;https://convertkit.com/features/forms?utm_campaign=poweredby&amp;utm_content=form&amp;utm_medium=referral&amp;utm_source=dynamic&quot;},&quot;recaptcha&quot;:{&quot;enabled&quot;:false},&quot;return_visitor&quot;:{&quot;action&quot;:&quot;show&quot;,&quot;custom_content&quot;:&quot;&quot;},&quot;slide_in&quot;:{&quot;display_in&quot;:&quot;bottom_right&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;sticky_bar&quot;:{&quot;display_in&quot;:&quot;top&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15}},&quot;version&quot;:&quot;5&quot;}"
        min-width="400 500 600 700 800">
        <div data-style="full">
            <div data-element="column" class="formkit-column">
                <div class="formkit-header" data-element="header">
                    <h3 class="ntm">ARC Prize 2025: Get Started</h3>
                    <p>Competition is now open on Kaggle! Mar 26 - Nov 3. Sign up below for details.</p>
                </div>
                <ul class="formkit-alert formkit-alert-error" data-element="errors" data-group="alert"></ul>
                <div data-element="fields" class="seva-fields formkit-fields">
                    <div class="formkit-field"><input class="formkit-input" name="email_address"
                            aria-label="Email Address" placeholder="Email Address" required="" type="email"></div>
                    <button data-element="submit" class="formkit-submit formkit-submit bg-magenta"
                        style="padding:10px 30px;">
                        <div class="formkit-spinner">
                            <div></div>
                            <div></div>
                            <div></div>
                        </div><span>Sign Up</span>
                    </button>
                </div>
                <div class="formkit-disclaimer" data-element="disclaimer">
                    <small>No spam. You can unsubscribe at anytime.</small>
                </div>
            </div>
        </div>
    </form>
</div>
<div id="newsletter" class="modal">
    <script src="https://f.convertkit.com/ckjs/ck.5.js"></script>
    <form action="https://app.convertkit.com/forms/6685080/subscriptions" class="seva-form formkit-form"
        method="post" data-sv-form="6685080" data-uid="bc80575d89" data-format="inline" data-version="5"
        data-options="{&quot;settings&quot;:{&quot;after_subscribe&quot;:{&quot;action&quot;:&quot;message&quot;,&quot;success_message&quot;:&quot;Success! Now check your email to confirm your subscription.&quot;,&quot;redirect_url&quot;:&quot;&quot;},&quot;analytics&quot;:{&quot;google&quot;:null,&quot;fathom&quot;:null,&quot;facebook&quot;:null,&quot;segment&quot;:null,&quot;pinterest&quot;:null,&quot;sparkloop&quot;:null,&quot;googletagmanager&quot;:null},&quot;modal&quot;:{&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;powered_by&quot;:{&quot;show&quot;:false,&quot;url&quot;:&quot;https://convertkit.com/features/forms?utm_campaign=poweredby&amp;utm_content=form&amp;utm_medium=referral&amp;utm_source=dynamic&quot;},&quot;recaptcha&quot;:{&quot;enabled&quot;:false},&quot;return_visitor&quot;:{&quot;action&quot;:&quot;show&quot;,&quot;custom_content&quot;:&quot;&quot;},&quot;slide_in&quot;:{&quot;display_in&quot;:&quot;bottom_right&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;sticky_bar&quot;:{&quot;display_in&quot;:&quot;top&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15}},&quot;version&quot;:&quot;5&quot;}"
        min-width="400 500 600 700 800">
        <div data-style="full">
            <div data-element="column" class="formkit-column">
                <div class="formkit-header" data-element="header">
                    <h3 class="ntm">ARC Prize : Newsletter</h3>
                    <p>Subscribe to get started and receive official contest updates and news.</p>
                </div>
                <ul class="formkit-alert formkit-alert-error" data-element="errors" data-group="alert"></ul>
                <div data-element="fields" class="seva-fields formkit-fields">
                    <div class="formkit-field"><input class="formkit-input" name="email_address"
                            aria-label="Email Address" placeholder="Email Address" required="" type="email"></div>
                    <button data-element="submit" class="formkit-submit formkit-submit bg-magenta"
                        style="padding:10px 30px;">
                        <div class="formkit-spinner">
                            <div></div>
                            <div></div>
                            <div></div>
                        </div><span>Subscribe</span>
                    </button>
                </div>
                <div class="formkit-disclaimer" data-element="disclaimer">
                    <small>No spam. You can unsubscribe at anytime.</small>
                </div>
            </div>
        </div>
    </form>
</div>
    
</body>

</html>