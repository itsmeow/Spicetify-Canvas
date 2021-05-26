<h1 align="center">Spicetify Canvas</h1>
<p align="center">
<img src="https://i.imgur.com/budrcEN.gif" alt="Canvas Example" />
</p>
&nbsp;
<p align="center">
<img src="https://img.shields.io/badge/for-spicetify-FA9128.svg?style=for-the-badge" alt="For Spicetify">
<img src="https://img.shields.io/badge/license-MIT-A31F34.svg?style=for-the-badge" alt="MIT License">
<a href="https://discord.itsmeow.dev/"><img src="https://img.shields.io/discord/504369356260769792.svg?logo=discord&amp;style=for-the-badge" alt="Discord"></a>
<a href="https://patreon.itsmeow.dev/"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dits_meow%26type%3Dpatrons&amp;style=for-the-badge" alt="PayPal"></a></p>

<p align="center"><em>The first implementation of <a href="https://canvas.spotify.com/">Spotify Canvas</a> for the Desktop client ever!</em><br/><strong>With XPUI / Spicetify 2.0 support!</strong></p>

## Demo

The extension is designed to show Canvases in the fullscreen view. The following are with minimal theming (this is what is included in `Themes/canvas`, for the new XPUI):

![Canvas w/o mouse overlay](https://i.imgur.com/e5usAdB.png)
![Canvas, overlay](https://i.imgur.com/NtJbFgE.png)

## How it works

The mobile Spotify client uses a protocol called [Protobuf](https://developers.google.com/protocol-buffers) to communicate with the bridge/cosmos/hermes API and request a canvas link for a given track. However, the Desktop and Web clients do not have protobuf-based implementations and purely send JSON requests.

[librespot-java](https://github.com/librespot-org/librespot-java/) was vital for figuring out the Protobuf format and endpoint for this request. Big thank you to [@devgianlu](https://github.com/devgianlu) for his work on librespot and the EntityCanvazRequest proto file.

Using the knowledge from librespot, I was able to make a fetch call that bypasses the javascript Cosmos API and does a direct web request with binary protobuf data. You can then decode the binary response to get a list of canvases for a given track (previously, I had to encode the binary as UTF-8 and use the builtin Cosmos client, which was very unreliable).

After that, a video tag is inserted into the fullscreen overlay's DOM with the src set to the canvas.

Sounds simple, right? We're just getting started. Canvases are H.264 encoded MP4 files. Spotify's client has MP4 disabled/not supported because MP4/H.264 is a proprietary format and Spotify has no license or use for it in the desktop client. This means the video _will not play_ with all of the above I just did.

Lucky for us, Chromium Embedded Framework (the browser the client works off of) is open-source, and you can build it yourself with MP4 enabled. You can literally drag and drop replace the built pak files and DLLs into the Spotify install folder and it will just work, so long as your branch is set to the one Spotify uses.

That's it! I will elaborate on the whole CEF thing in the installation section.

## Help and Troubleshooting

This app is not very easy to install. If you come across any problems, feel free to create an issue or contact me on my [Discord](https://discord.itsmeow.dev/)

## Installation (short version)

1. Install [Spicetify](https://github.com/khanhas/spicetify-cli)
2. Run `spicetify`
3. Run `spicetify backup apply`
4. Add the extension to the Spicetify extensions folder
5. Run `spicetify config extensions getCanvas.js`
6. Add the theme to the Spicetify themes folder
7. Run `spicetify config current_theme canvas` (If you want to use your own theme, paste the user.css contents into the end of your current theme's user.css)
8. Run `spicetify apply`
9. Read and follow part two of the long installation.

## Installation (long version)

**THIS INSTALLATION IS NOT EASY. YOU WILL NEED ~50-70GB HARD DRIVE SPACE, AT LEAST 8GB RAM, GOOD COMPUTER KNOWLEDGE, A DECENT PROCESSOR, GOOD INTERNET, AND A LOT OF TIME.**

### Part One (Easy)

The first part is pretty simple. Install [Spicetify](https://github.com/khanhas/spicetify-cli), you can look at how to do that [here](https://github.com/khanhas/spicetify-cli/wiki/Installation).

After that, run the `spicetify` command with no arguments to generate your configuration.

Then run `spicetify backup apply` to patch your client.

Now, navigate to your [Spicetify extensions directory](https://github.com/khanhas/spicetify-cli/wiki/Extensions) and put `getCanvas.js` from the Extensions folder of this repository into the folder. Run `spicetify config extensions getCanvas.js` to add the extension.

Next, navigate to your [Spicetify themes directory](https://github.com/khanhas/spicetify-cli/wiki/Customization#Themes) and place the `canvas` folder from `Themes` in this repository within it. Run `spicetify config current_theme canvas` to set your theme to the new theme.

If you want to use your own theme, take the code from `Themes/canvas/user.css` and paste it at the end of your current theme. No guarantees this will work, but I tried to make it as universal and unintrusive as possible.

Next, run `spicetify apply` to load the new theme and extensions into your client.

### Part Two (Pain and Suffering)

Most extensions end installation steps here, but this extension is a LOT harder to get working due to some limitations of the Spotify client. You will need to build [Chromium Embedded Framework](https://bitbucket.org/chromiumembedded/cef) with proprietary codecs enabled. If you want a more detailed explanation of _why_, read "How it works".

I'd love to just post the build myself for everyone to use, but that would be violating copyright law, so you have to build it yourself.

I've only ever done this on Windows, so my instructions will be mostly catered for Windows. If someone wishes to contribute instructions for other OSes, feel free to make a pull request.

#### Pre-requisites

You will need the prerequisites for your OS listed [here](https://bitbucket.org/chromiumembedded/cef/wiki/AutomatedBuildSetup.md) under "Platform Build Configurations". You can also view those requirements [here](https://chromium.googlesource.com/chromium/src/+/master/docs/windows_build_instructions.md) for more detail.

I will sum them up:

- [Python](https://www.python.org/downloads/) (2.7 or 3.8/3.9, I used 3.8)
- [Visual Studio Community 2017 or 2019, or Visual Studio Build Tools 2017 or 2019](https://visualstudio.microsoft.com/downloads/)
- "Desktop development with C++", "C++ MFC for latest v(version) build tools (x86 & x64)", C++ ATL for latest v(version) build tools (x86 & x64)" support Visual Studio components. You can install these with the "Visual Studio Installer" program, click Modify on your VS install and find those packages. You don't need the ARM components.
- "Windows 10 SDK 10.0.19041" or higher as a VS component or from [Microsoft's installer](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk/). Make sure you enable the "SDK Debugging Tools" in this installer. If you use Visual Studio to install it, Chromium says you can get it from "Control Panel → Programs → Programs and Features → Select the “Windows Software Development Kit” → Change → Change → Check “Debugging Tools For Windows” → Change", but personally I had to use the installer and select _only_ the debugging tools since I already had the SDK from VS. **If you miss the debugger installation step, your build will error.**

#### Getting the branch number

Next, you need to find the CEF branch for your Spotify version. Spotify lists these relations [here](https://www.spotify.com/us/opensource/). If you hover over the "CEF version" link for your Spotify version, it links to a URL that looks like this `https://bitbucket.org/chromiumembedded/cef/get/4430.tar.bz2`. The number you want is the number before `.tar.bz2`. As of current, that branch number is `4430` in Chromium version `90.0.4430.93` for Spotify `1.1.60.668`.

You can verify you have the correct version by enabling devtools in spicetify `spicetify enable-devtool apply`, right clicking somewhere, press "Show Chrome Tools", and then click the `chrome://version` link. The CEF and chromium version should match.

#### Setup

Next, go to `C:\` in This PC and create a folder called `code`. Inside `code`, make a folder called `chromium_git`, and a folder called `depot_tools`.
This is the end result:

```
C:\code\
  chromium_git\
  depot_tools\
```

Next, download [automate-git.py](https://bitbucket.org/chromiumembedded/cef/raw/master/tools/automate/automate-git.py) and place it in `C:\code\`.

Create a batch script inside `C:\code\`, name it `build.bat`. If the name change doesn't change the icon, press View in file explorer and check "File name extensions" and rename it again. Paste the following into this script and save it (you can open it by right clicking and pressing edit):

```
set CEF_USE_GN=1
set GN_DEFINES=is_official_build=true proprietary_codecs=true ffmpeg_branding=Chrome enable_nacl=false blink_symbol_level=0 symbol_level=0
set GYP_MSVS_VERSION=2019
set CEF_ARCHIVE_FORMAT=tar.bz2
python automate-git.py --download-dir=C:\code\chromium_git --branch=4430 --no-debug-build
```

Change `4430` from `--branch` to the proper branch for your Spotify version.

If you use VS 2017, change `GYP_MSVS_VERSION` to 2017.

Next, open command prompt as administator (NOT POWERSHELL). You can do this by searching Command Prompt in the Start Menu, right clicking it, and pressing "Run as Administrator".

Change directories to the automate folder. `cd C:\code\automate` (if you use another drive than C, use `cd /d (path)`)

#### Run it!

Execute the script. `build.bat`. This will take _many_ hours to download CEF, depot_tools, and Chromium. After which it will check out the correct branches and build Chromium.

### Re-using your folder

If you want to use the CEF build folders again (for Spotify updates, it isn't super rare Spotify changes the internal CEF version used), you should add `--depot-tools-dir=C:\code\depot_tools` after the first run so that it won't download it again. You can also get commit checkout errors, so if you encounter any of those add `--force-clean` to remove the old commit data and force a change.

### Possible Errors + Solutions

#### CalledProcessError: Command 'gn gen out'

If you get an error that looks like this:

```
subprocess2.CalledProcessError: Command 'gn gen out\\Debug_GN_x86 --ide=vs2019 --sln=cef --filters=//cef/*' returned non-zero exit status 1 in C:\code\chromium_git\chromium\src\...
```

It means you forgot to install the Windows SDK debugging tools. Review the Prerequisites.

#### Hash does not appear to be a valid hash in this repo

If you get an error that looks like this when it says `Running "gclient revert --nohooks"` after the download stage (I did, not sure why) `gclient_scm.NoUsableRevError: 82> Hash ee537ac096667eed6559124164c3e8482646fd77 does not appear to be a valid hash in this repo`, go to `C:/depot_tools/gclient_scm.py`, open it in a text editor, find line 879 (Ctrl + F "NoUsableRevError"), and comment out `logging.warning("Couldn't find usable revision, will retrying to update instead: %s", e.message))`. It's split onto three lines, so put a `#` before each line.

It will end up like this:

```python
    except NoUsableRevError as e:
      # If the DEPS entry's url and hash changed, try to update the origin.
      # See also http://crbug.com/520067.
      #logging.warning(
       #   "Couldn't find usable revision, will retrying to update instead: %s",
        #  e.message)
      return self.update(options, [], file_list)
```

After editing that, go to your automate batch script and add `--no-depot-tools-update` and `--depot-tools-dir=C:\code\depot_tools` to the arguments list for the python command, otherwise your changes will be overwritten. Rerun the script, it should've saved most of the progress from that point.

### Results

After around 12 hours with my AMD Ryzen 3600, my build was completed, not counting errors and troubleshooting. The results are placed in `C:\code\chromium_git\chromium\src\out\Release_GN_x86`. You will know if it's done because `cefclient.exe` will exist in this folder. Run the client, go to some sites, make sure it works. Go to `https://html5test.com`, check under `Video` and make sure there is a check next to `H.264 support`. If not, you messed something up.

If it works, good news, you're almost done!

Now, in another Explorer, go to `%appdata%/Spotify`. You can type this in the address bar or use WinKey+R to open it. This folder contains your Spotify installation (Spotify.exe, cef.pak, etc).

The first thing you need to do is **disable auto-updating**, because Spotify will overwrite your CEF patches every time you run `spicetify apply` otherwise. Do this by deleting or renaming `SpotifyMigrator.exe` or `SpotifyUpdate.exe` if present.

Next, you will need to back up your old CEF assets. Create a folder called `backup` in the Spotify folder, and move into it all of the following files:

- cef.pak
- cef_100_percent.pak
- cef_200_percent.pak
- cef_extensions.pak
- chrome_elf.dll
- d3dcompiler_47.dll
- devtools_resources.pak
- icudtl.dat
- libcef.dll
- libEGL.dll
- libGLESv2.dll
- snapshot_blob.bin
- v8_context.snapshot.bin
- The entire `swiftshader` folder
- The entire `locales` folder

Next, from the `Release_GN_x86` folder, copy all of the files and folders with names matching the above into your Spotify folder.

The `locales` and `swiftshader` folders you copy will contain a bunch of `.info`, `.pdb`, and `.lib` files. You can delete any files that are not `.pak` or `.dll`.

You should also copy the same set of files you copied into Spotify into another, safe folder, in case Spotify updates or is uninstalled. You DO NOT want to lose them and rebuild Chromium. I also copied my entire `Release_GN_x86` folder just to be sure, but it may be large.

Finally, start Spotify! If you did things correctly, Spotify should run as normal, except now the Canvases will appear. You can delete the contents of `C:/code/chromium_git` and `C:/code/depot_tools` to save space, but I recommend keeping the script just in case Spotify updates.

If you made it this far, you are truly technically compotent! Congratulations.

#### Help and Troubleshooting

If you come accross any issues not listed above, let me know! You can create an issue here or chat in my [Discord](https://discord.itsmeow.dev/). If you find a solution to a certain issue, feel free to PR the issue and solution under the Errors header.
