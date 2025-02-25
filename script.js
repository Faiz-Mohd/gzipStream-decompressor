var container = document.getElementById("jsoneditor");
      var options = {
        mode: "tree",
      };
      var editor = new JSONEditor(container, options);
      
      // Set up copy JSON button
      document.getElementById('copyJsonBtn').addEventListener('click', function() {
        try {
          const jsonContent = JSON.stringify(editor.get());
          navigator.clipboard.writeText(jsonContent)
            .then(() => {
              const btn = this;
              const originalText = btn.textContent;
              btn.textContent = "Copied!";
              setTimeout(() => {
                btn.textContent = originalText;
              }, 1500);
            })
            .catch(err => {
              console.error('Failed to copy: ', err);
              alert('Failed to copy to clipboard');
            });
        } catch (err) {
          console.error('Error copying JSON: ', err);
          alert('Error copying JSON: ' + err.message);
        }
      });
      
      function decompress() {
        const input = document.getElementById("input").value;

        const decompressedChunks = decompressEventStream(input);

        const output = document.getElementById("output");
        output.innerHTML = "";

        for (let i = 0; i < decompressedChunks.length; i++) {
          var chunkSize = new Blob([decompressedChunks[i]]).size;
          chunkSize = Math.round(chunkSize / 1024);
          const chunkLabel = `Chunk ${i + 1} (${chunkSize} KB)`;
          const chunkText = decompressedChunks[i];

          const chunkDiv = document.createElement("div");
          chunkDiv.className = "chunk";
          
          const chunkHeader = document.createElement("div");
          chunkHeader.className = "chunk-header";
          
          const label = document.createElement("span");
          label.className = "chunk-label";
          label.innerText = chunkLabel;
          chunkHeader.appendChild(label);
          
          const buttonGroup = document.createElement("div");
          buttonGroup.className = "chunk-buttons";

          const viewButton = document.createElement("button");
          viewButton.className = "view-button";
          viewButton.innerText = "View JSON";
          buttonGroup.appendChild(viewButton);

          const copyButton = document.createElement("button");
          copyButton.className = "copy-button";
          copyButton.innerText = "Copy";
          buttonGroup.appendChild(copyButton);
          
          chunkHeader.appendChild(buttonGroup);
          chunkDiv.appendChild(chunkHeader);

          const textarea = document.createElement("textarea");
          textarea.value = chunkText;
          textarea.readOnly = true;
          chunkDiv.appendChild(textarea);

          copyButton.onclick = () => {
            textarea.select();
            document.execCommand("copy");
          };
          
          viewButton.onclick = () => {
            try {
              editor.set(JSON.parse(textarea.value));
              // Scroll to the JSON editor on mobile
              if (window.innerWidth <= 900) {
                document.getElementById('jsoneditor').scrollIntoView({ behavior: 'smooth' });
              }
            } catch (e) {
              alert("Invalid JSON: " + e.message);
            }
          };

          output.appendChild(chunkDiv);
        }
      }
      
      function decompressEventStream(gzipText) {
        const decompressedChunks = [];
        const gzipDecoder = new TextDecoder("utf-8");

        const startIndex = gzipText.search(/\bid:(?! HANDSHAKE)/);
        if (startIndex >= 0) {
          gzipText = gzipText.substring(startIndex);
        }
        console.log(gzipText);

        const lines = gzipText.split("\n");

        let compressedData = "";
        for (const line of lines) {
          if (!gzipText.includes("data:")) {
            compressedData += line;
          }
          if (line.startsWith("data: ")) {
            compressedData += line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            compressedData += line.slice(5).trim();
          } else {
            if (compressedData.length > 0) {
              const compressedBytes = Uint8Array.from(
                atob(compressedData),
                (c) => c.charCodeAt(0)
              );
              const decompressedBytes = pako.inflate(compressedBytes);
              const decompressedText = gzipDecoder.decode(decompressedBytes);

              decompressedChunks.push(decompressedText);
              compressedData = "";
            }
          }
        }

        return decompressedChunks;
      }