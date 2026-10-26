"""Convert a white mark on a black field into gradient PWA icons.
No third-party modules. The original icon.png is never modified.
"""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def paeth(a, b, c):
    p = a + b - c
    distances = (abs(p-a), abs(p-b), abs(p-c))
    return (a, b, c)[distances.index(min(distances))]


def read_png(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', 'Not a PNG'
    pos, compressed = 8, bytearray()
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        kind, payload = data[pos+4:pos+8], data[pos+8:pos+8+length]
        if kind == b'IHDR':
            width, height, depth, color, _, _, interlace = struct.unpack('>IIBBBBB', payload)
        elif kind == b'IDAT':
            compressed.extend(payload)
        pos += length + 12
    assert depth == 8 and color in (2, 6) and interlace == 0, 'Expected non-interlaced 8-bit RGB/RGBA'
    channels = 3 if color == 2 else 4
    stride, raw = width * channels, zlib.decompress(compressed)
    rows, previous, offset = [], bytearray(stride), 0
    for _ in range(height):
        mode = raw[offset]
        row = bytearray(raw[offset+1:offset+1+stride])
        offset += stride + 1
        for i in range(stride):
            a = row[i-channels] if i >= channels else 0
            b = previous[i]
            c = previous[i-channels] if i >= channels else 0
            prediction = (0, a, b, (a+b)//2, paeth(a,b,c))[mode]
            row[i] = (row[i] + prediction) & 255
        rows.append(row)
        previous = row
    return width, height, channels, rows


def write_png(path, size, pixels):
    def chunk(kind, data):
        return struct.pack('>I',len(data)) + kind + data + struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    raw = b''.join(b'\0'+pixels[y*size*4:(y+1)*size*4] for y in range(size))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))


def generate():
    width,height,channels,rows = read_png(ROOT/'icon.png')
    out = ROOT/'assets'
    out.mkdir(exist_ok=True)
    for size in (192,512):
        pixels = bytearray()
        corner_radius = size * .2
        half_size = size / 2
        for y in range(size):
            for x in range(size):
                sx,sy = x/size*width,y/size*height
                samples=[]
                for dx,dy in ((0,0),(.5,0),(0,.5),(.5,.5)):
                    ix=min(width-1,int(sx+dx*width/size))
                    iy=min(height-1,int(sy+dy*height/size))
                    p=rows[iy][ix*channels:ix*channels+channels]
                    luminance=(p[0]*.2126+p[1]*.7152+p[2]*.0722)/255
                    samples.append(luminance*(p[3]/255 if channels==4 else 1))
                alpha=sum(samples)/len(samples)
                t=min(1,max(0,(x+y)/(2*size)))
                if t < .65:
                    start,end,amount=(192,132,252),(115,99,239),t/.65
                else:
                    start,end,amount=(115,99,239),(99,102,241),(t-.65)/.35
                gradient=tuple(round(start[i]+(end[i]-start[i])*amount) for i in range(3))
                qx=abs(x+.5-half_size)-(half_size-corner_radius)
                qy=abs(y+.5-half_size)-(half_size-corner_radius)
                outside=(max(qx,0)**2+max(qy,0)**2)**.5
                distance=outside+min(max(qx,qy),0)-corner_radius
                corner_coverage=min(1,max(0,.5-distance))
                pixels.extend([round(gradient[i]*(1-alpha)+255*alpha) for i in range(3)]+[round(255*corner_coverage)])
        write_png(out/f'icon-{size}.png',size,pixels)
        print(f'Generated assets/icon-{size}.png')


if __name__ == '__main__':
    generate()
