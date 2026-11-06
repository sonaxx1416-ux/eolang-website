//go:build js && wasm

package main

import (
	"bufio"
	"bytes"
	"fmt"
	"strings"
	"syscall/js"
)

var _ = cliMain

// runSource runs one eo program and returns what it printed, the error text and the exit code.
func runSource(src, stdin string) (string, string, int) {
	var ob bytes.Buffer
	out := bufio.NewWriter(&ob)
	var eb strings.Builder
	mainMod := &Module{Name: "main", Dir: ".", Global: &Env{}, Funcs: map[string]*FuncDecl{}}
	in := &Interp{cur: mainMod, modules: map[string]*Module{"": mainMod}, in: bufio.NewReader(strings.NewReader(stdin)), out: out}
	code := 0
	func() {
		defer func() {
			if r := recover(); r != nil {
				out.Flush()
				switch x := r.(type) {
				case *EOError:
					eb.WriteString(x.Error())
					code = 1
				case *exitSignal:
					code = x.code
				default:
					eb.WriteString(fmt.Sprint(r))
					code = 2
				}
			}
		}()
		in.run(parse(strings.TrimPrefix(src, "\uFEFF"), "."))
	}()
	out.Flush()
	return ob.String(), eb.String(), code
}

func main() {
	// eoRun(src, stdin, id) runs in its own goroutine (blocking calls like sleep can't run inside a JS callback)
	// and posts {type:"done", id, out, err, code} back to the worker when it finishes.
	js.Global().Set("eoRun", js.FuncOf(func(this js.Value, a []js.Value) any {
		src, stdin, id := a[0].String(), a[1].String(), a[2].Int()
		go func() {
			o, e, c := runSource(src, stdin)
			js.Global().Call("postMessage", map[string]any{"type": "done", "id": id, "out": o, "err": e, "code": c})
		}()
		return nil
	}))
	js.Global().Call("postMessage", map[string]any{"type": "ready"})
	select {}
}
